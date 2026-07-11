ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS archived_by_name text;

-- Prevent modification of archived documents (only admins can un-archive)
DROP POLICY IF EXISTS "Authenticated can update documents" ON public.documents;
CREATE POLICY "Update documents unless archived"
ON public.documents FOR UPDATE
USING (is_archived = false OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (true);