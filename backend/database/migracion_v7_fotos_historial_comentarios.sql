-- ------------------------------------------------------------
-- Migracion v7: foto de perfil (alumnos/docentes), historial de
-- versiones de notas, y comentarios en avisos.
-- ------------------------------------------------------------

ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);

CREATE TABLE IF NOT EXISTS notas_historial (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nota_id INT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  nota_anterior DECIMAL(4,2) NOT NULL,
  observacion_anterior VARCHAR(255),
  modificado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  modificado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notas_historial_nota ON notas_historial (nota_id, modificado_en DESC);

CREATE TABLE IF NOT EXISTS avisos_comentarios (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aviso_id INT NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  contenido VARCHAR(500) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_avisos_comentarios_aviso ON avisos_comentarios (aviso_id, creado_en);
