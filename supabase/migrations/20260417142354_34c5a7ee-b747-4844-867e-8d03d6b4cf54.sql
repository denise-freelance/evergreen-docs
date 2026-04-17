
-- FOLDERS
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  parent_path TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_folders_parent ON public.folders(parent_path);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read folders" ON public.folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create folders" ON public.folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update folders" ON public.folders FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can delete folders" ON public.folders FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

-- DOCUMENTS
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  folder TEXT NOT NULL DEFAULT '/',
  status TEXT NOT NULL DEFAULT 'draft',
  version TEXT NOT NULL DEFAULT 'v1',
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  storage_path TEXT,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_folder ON public.documents(folder);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_updated ON public.documents(updated_at DESC);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authenticated can update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Owner or admin can delete documents" ON public.documents FOR DELETE TO authenticated USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACTIVITIES
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_initials TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_created ON public.activities(created_at DESC);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can read document files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated can upload document files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Authenticated can update document files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Owner can delete document files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND owner = auth.uid());
