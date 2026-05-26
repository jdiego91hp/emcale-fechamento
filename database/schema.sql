-- ============================================================
-- Schema SQL — Sistema de Fechamento Técnico Emcale
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: materials
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT          NOT NULL,
  unit       TEXT          NOT NULL,
  active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Fix 3: UNIQUE em name para que ON CONFLICT DO NOTHING funcione nos dados iniciais
  CONSTRAINT materials_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(active);
CREATE INDEX IF NOT EXISTS idx_materials_name   ON materials(name);

-- ============================================================
-- TABELA: service_types
-- ============================================================
CREATE TABLE IF NOT EXISTS service_types (
  id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT          NOT NULL,
  active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Fix 3: UNIQUE em name para que ON CONFLICT DO NOTHING funcione nos dados iniciais
  CONSTRAINT service_types_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(active);
CREATE INDEX IF NOT EXISTS idx_service_types_name   ON service_types(name);

-- ============================================================
-- TABELA: ticket_closures
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_closures (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id        TEXT          NOT NULL,
  ticket_name      TEXT          NOT NULL,
  company          TEXT          NOT NULL,
  technician_name  TEXT          NOT NULL,
  notes            TEXT,
  pdf_url          TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tc_ticket_id  ON ticket_closures(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tc_created_at ON ticket_closures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tc_technician ON ticket_closures(technician_name);
CREATE INDEX IF NOT EXISTS idx_tc_company    ON ticket_closures(company);

-- ============================================================
-- TABELA: closure_materials
-- ============================================================
CREATE TABLE IF NOT EXISTS closure_materials (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  closure_id    UUID           NOT NULL REFERENCES ticket_closures(id) ON DELETE CASCADE,
  material_id   UUID           REFERENCES materials(id) ON DELETE SET NULL,
  material_name TEXT           NOT NULL,
  unit          TEXT           NOT NULL,
  quantity      NUMERIC(10,2)  NOT NULL CHECK (quantity > 0),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cm_closure_id ON closure_materials(closure_id);

-- ============================================================
-- TABELA: closure_services
-- ============================================================
CREATE TABLE IF NOT EXISTS closure_services (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  closure_id       UUID          NOT NULL REFERENCES ticket_closures(id) ON DELETE CASCADE,
  service_type_id  UUID          REFERENCES service_types(id) ON DELETE SET NULL,
  service_name     TEXT          NOT NULL,
  quantity_or_note TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_closure_id ON closure_services(closure_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- Fix 2: PostgreSQL suporta CREATE OR REPLACE TRIGGER apenas no PG14+
-- Supabase usa PG15 — OK. Para segurança: DROP IF EXISTS antes de criar.
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_materials_updated_at    ON materials;
DROP TRIGGER IF EXISTS trg_service_types_updated_at ON service_types;
DROP TRIGGER IF EXISTS trg_ticket_closures_updated_at ON ticket_closures;

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_service_types_updated_at
  BEFORE UPDATE ON service_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ticket_closures_updated_at
  BEFORE UPDATE ON ticket_closures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS — Row Level Security
-- ============================================================

ALTER TABLE materials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_closures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_services  ENABLE ROW LEVEL SECURITY;

-- materials
CREATE POLICY "mat_select_all"   ON materials FOR SELECT USING (true);
CREATE POLICY "mat_insert_admin" ON materials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mat_update_admin" ON materials FOR UPDATE
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mat_delete_admin" ON materials FOR DELETE USING (auth.role() = 'authenticated');

-- service_types
CREATE POLICY "svc_select_all"   ON service_types FOR SELECT USING (true);
CREATE POLICY "svc_insert_admin" ON service_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "svc_update_admin" ON service_types FOR UPDATE
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "svc_delete_admin" ON service_types FOR DELETE USING (auth.role() = 'authenticated');

-- ticket_closures
-- Nota: as API routes usam service_role → bypassam RLS
-- RLS aqui protege acesso direto ao banco (ex: Supabase Studio, REST API direta)
CREATE POLICY "tc_select_admin"  ON ticket_closures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tc_insert_public" ON ticket_closures FOR INSERT WITH CHECK (true);
CREATE POLICY "tc_update_service" ON ticket_closures FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tc_delete_admin"  ON ticket_closures FOR DELETE USING (auth.role() = 'authenticated');

-- closure_materials
CREATE POLICY "cm_select_admin"  ON closure_materials FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cm_insert_public" ON closure_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "cm_delete_admin"  ON closure_materials FOR DELETE USING (auth.role() = 'authenticated');

-- closure_services
CREATE POLICY "cs_select_admin"  ON closure_services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cs_insert_public" ON closure_services FOR INSERT WITH CHECK (true);
CREATE POLICY "cs_delete_admin"  ON closure_services FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- DADOS INICIAIS — Materiais
-- Fix 3: ON CONFLICT agora usa a constraint UNIQUE(name)
-- ============================================================
INSERT INTO materials (name, unit) VALUES
  ('Cabo Drop',              'metro'),
  ('Cabo Óptico 6 Fibras',   'metro'),
  ('Cabo Óptico 12 Fibras',  'metro'),
  ('Conector SC/APC',        'unidade'),
  ('Conector SC/UPC',        'unidade'),
  ('Bandeja de Fusão',       'unidade'),
  ('CTO 8 Portas',           'unidade'),
  ('CTO 16 Portas',          'unidade'),
  ('Splitter 1x8',           'unidade'),
  ('Splitter 1x16',          'unidade'),
  ('Fita Isolante',          'unidade'),
  ('Abraçadeira',            'pacote'),
  ('Gancho para Poste',      'unidade'),
  ('Lacre Plástico',         'pacote'),
  ('Manga de Emenda',        'unidade')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DADOS INICIAIS — Serviços
-- ============================================================
INSERT INTO service_types (name) VALUES
  ('Lançamento de Cabo'),
  ('Fusão de Fibra'),
  ('Instalação de CTO'),
  ('Teste de Sinal'),
  ('Reparo de Drop'),
  ('Instalação de ONU'),
  ('Configuração de Roteador'),
  ('Atendimento ao Cliente'),
  ('Instalação de Splitter'),
  ('Medição de Perda Óptica')
ON CONFLICT (name) DO NOTHING;
