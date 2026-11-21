-- ------------------------------------------------------------
-- Migracion v8: nota del bimestre ponderada.
-- Componentes: promedio de tareas, promedio de practicas,
-- examen 1 y examen 2. Los porcentajes los define solo el admin.
-- ------------------------------------------------------------
ALTER TABLE notas ADD COLUMN IF NOT EXISTS prom_tareas DECIMAL(4,2);
ALTER TABLE notas ADD COLUMN IF NOT EXISTS prom_practicas DECIMAL(4,2);
ALTER TABLE notas ADD COLUMN IF NOT EXISTS examen1 DECIMAL(4,2);
ALTER TABLE notas ADD COLUMN IF NOT EXISTS examen2 DECIMAL(4,2);

CREATE TABLE IF NOT EXISTS config_evaluacion (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  peso_tareas SMALLINT NOT NULL DEFAULT 20,
  peso_practicas SMALLINT NOT NULL DEFAULT 20,
  peso_examen1 SMALLINT NOT NULL DEFAULT 30,
  peso_examen2 SMALLINT NOT NULL DEFAULT 30,
  actualizado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (peso_tareas + peso_practicas + peso_examen1 + peso_examen2 = 100)
);
INSERT INTO config_evaluacion (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
