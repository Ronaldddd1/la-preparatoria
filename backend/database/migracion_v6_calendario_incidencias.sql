-- ------------------------------------------------------------
-- Migracion v6: calendario academico (feriados/examenes/bimestres)
-- e incidencias de conducta por alumno.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS calendario_academico (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('feriado', 'examen', 'inicio_bimestre', 'fin_bimestre', 'otro')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  descripcion VARCHAR(255),
  anio_escolar SMALLINT NOT NULL,
  creado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calendario_fechas ON calendario_academico (fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_calendario_anio ON calendario_academico (anio_escolar);

CREATE TABLE IF NOT EXISTS incidencias (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('positiva', 'leve', 'moderada', 'grave')),
  descripcion VARCHAR(500) NOT NULL,
  registrado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incidencias_alumno ON incidencias (alumno_id, creado_en DESC);
