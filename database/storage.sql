-- ============================================================
-- Storage: bucket 'reports' para os PDFs gerados
-- Execute no SQL Editor do Supabase APÓS o schema.sql
-- ============================================================

-- Criar bucket público para PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  true,
  10485760,             -- 10 MB por arquivo
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Fix 6: habilitar RLS na tabela storage.objects (obrigatório para políticas funcionarem)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa pode fazer upload (técnico sem login)
CREATE POLICY "reports_insert_public"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'reports');

-- Política: qualquer pessoa pode ler/baixar o PDF (link público)
CREATE POLICY "reports_select_public"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'reports');

-- Política: apenas usuário autenticado (admin) pode deletar PDFs
CREATE POLICY "reports_delete_admin"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- Política: qualquer pessoa pode atualizar (upsert pelo técnico)
CREATE POLICY "reports_update_public"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'reports')
  WITH CHECK (bucket_id = 'reports');
