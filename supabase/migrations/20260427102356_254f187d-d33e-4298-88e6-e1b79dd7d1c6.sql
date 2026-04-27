
-- Validation requests table
CREATE TABLE public.validation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_name text NOT NULL,
  submitted_by uuid NOT NULL,
  submitted_by_name text NOT NULL,
  validator_id uuid NOT NULL,
  validator_name text NOT NULL,
  deadline date,
  message text,
  status text NOT NULL DEFAULT 'pending',
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.validation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can create validation requests"
ON public.validation_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Participants and admin can read validation requests"
ON public.validation_requests FOR SELECT TO authenticated
USING (
  auth.uid() = submitted_by
  OR auth.uid() = validator_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Validator or admin can update validation requests"
ON public.validation_requests FOR UPDATE TO authenticated
USING (
  auth.uid() = validator_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Submitter or admin can delete validation requests"
ON public.validation_requests FOR DELETE TO authenticated
USING (
  auth.uid() = submitted_by
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER validation_requests_updated_at
BEFORE UPDATE ON public.validation_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_validation_requests_validator ON public.validation_requests(validator_id);
CREATE INDEX idx_validation_requests_submitter ON public.validation_requests(submitted_by);
CREATE INDEX idx_validation_requests_document ON public.validation_requests(document_id);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipient or admin can read notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Recipient can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Recipient or admin can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- Trigger: when a validation request is created, set document status to pending
CREATE OR REPLACE FUNCTION public.handle_validation_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.documents SET status = 'pending', updated_at = now() WHERE id = NEW.document_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.documents SET status = 'approved', updated_at = now() WHERE id = NEW.document_id;
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.documents SET status = 'rejected', reject_reason = NEW.decision_reason, updated_at = now() WHERE id = NEW.document_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validation_requests_sync_doc_status
AFTER INSERT OR UPDATE ON public.validation_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_validation_request_status();
