-- ============================================================
-- La Preparatoria — Migración v4: mensajería alumno-docente y
-- justificación de faltas con archivo adjunto.
-- Correr en psql conectado a la base de datos de Railway.
-- ============================================================

CREATE TABLE IF NOT EXISTS mensajes (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  horario_id INT NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
  alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  remitente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  archivo_url VARCHAR(500),
  archivo_nombre VARCHAR(255),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mensajes_horario_alumno ON mensajes(horario_id, alumno_id);

CREATE TABLE IF NOT EXISTS justificaciones_falta (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asistencia_id INT NOT NULL UNIQUE REFERENCES asistencias(id) ON DELETE CASCADE,
  alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  comentario TEXT,
  archivo_url VARCHAR(500),
  archivo_nombre VARCHAR(255),
  estado VARCHAR(10) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  resuelto_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  resuelto_en TIMESTAMPTZ
);
