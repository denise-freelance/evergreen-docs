-- DOCUMENT SHARES (user-to-user)
CREATE TABLE public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  shared_with_user_id UUID NOT NULL,
  shared_with_name TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'read',
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, shared_with_user_id)
);
CREATE INDEX idx_doc_shares_doc ON public.document_shares(document_id);
CREATE INDEX idx_doc_shares_user ON public.document_shares(shared_with_user_id);
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see shares involving them"
  ON public.document_shares FOR SELECT TO authenticated
  USING (auth.uid() = shared_with_user_id OR auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can create shares"
  ON public.document_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can delete shares"
  ON public.document_shares FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can update shares"
  ON public.document_shares FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

-- PUBLIC LINKS
CREATE TABLE public.document_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_public_links_doc ON public.document_public_links(document_id);
CREATE INDEX idx_public_links_token ON public.document_public_links(token);
ALTER TABLE public.document_public_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin can read public links"
  ON public.document_public_links FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can create public links"
  ON public.document_public_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update public links"
  ON public.document_public_links FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete public links"
  ON public.document_public_links FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

-- Allow searching profiles by username for sharing autocomplete
CREATE POLICY "Authenticated can search profiles for sharing"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);