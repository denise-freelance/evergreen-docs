
DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;

CREATE POLICY "Users can create notifications for self or as submitter"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.validation_requests vr
    WHERE vr.validator_id = public.notifications.user_id
      AND vr.submitted_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
