-- ------------------------------------------------------------
-- Migracion v5: la asistencia pasa a registrarse UNA vez por dia
-- por alumno (por seccion), en vez de una vez por cada curso/clase.
-- ------------------------------------------------------------

-- 1) Nueva columna: a que sección pertenece el registro de asistencia.
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS seccion_id INT REFERENCES secciones(id);

-- 2) Rellenar seccion_id para registros existentes, tomando la sección
--    del horario con el que se guardaron originalmente.
UPDATE asistencias asi
SET seccion_id = h.seccion_id
FROM horarios h
WHERE h.id = asi.horario_id AND asi.seccion_id IS NULL;

-- 3) horario_id ya no es obligatorio (los registros nuevos no usan curso).
ALTER TABLE asistencias ALTER COLUMN horario_id DROP NOT NULL;

-- 4) La restricción de unicidad anterior era por (horario_id, alumno_id, fecha).
--    Ahora debe ser por (seccion_id, alumno_id, fecha): un solo registro de
--    asistencia por alumno y por día, sin importar el curso.
ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS asistencias_horario_id_alumno_id_fecha_key;

CREATE UNIQUE INDEX IF NOT EXISTS asistencias_seccion_alumno_fecha_key
  ON asistencias (seccion_id, alumno_id, fecha)
  WHERE seccion_id IS NOT NULL;

-- 5) Todo registro debe tener al menos seccion_id (nuevos) u horario_id
--    (historicos, por si algo quedo sin poder mapearse en el paso 2).
ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS asistencias_seccion_o_horario_check;
ALTER TABLE asistencias ADD CONSTRAINT asistencias_seccion_o_horario_check
  CHECK (seccion_id IS NOT NULL OR horario_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_asistencias_seccion_fecha ON asistencias (seccion_id, fecha);
