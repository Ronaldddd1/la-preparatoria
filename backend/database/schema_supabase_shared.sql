-- ============================================================
-- La Preparatoria — Sistema Integral de Gestión Académica y Administrativa
-- Esquema PostgreSQL en un schema dedicado ("la_preparatoria") dentro
-- de un proyecto Supabase compartido (p. ej. "TransJer"), para no
-- chocar con las tablas de otros proyectos que vivan en ese mismo
-- proyecto de Supabase (schema "public").
-- ============================================================

CREATE SCHEMA IF NOT EXISTS la_preparatoria;
SET search_path TO la_preparatoria;

-- ------------------------------------------------------------
-- Usuarios: login único para alumnos, docentes y administradores
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.usuarios (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(10) NOT NULL DEFAULT 'alumno' CHECK (rol IN ('alumno', 'admin', 'docente')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  debe_cambiar_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Catálogo académico
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.grados (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  nivel VARCHAR(12) NOT NULL CHECK (nivel IN ('Inicial', 'Primaria', 'Secundaria')),
  orden INT NOT NULL DEFAULT 0
);

CREATE TABLE la_preparatoria.secciones (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grado_id INT NOT NULL REFERENCES la_preparatoria.grados(id) ON DELETE CASCADE,
  nombre VARCHAR(5) NOT NULL,
  capacidad INT NOT NULL DEFAULT 30,
  anio_escolar SMALLINT NOT NULL,
  UNIQUE (grado_id, nombre, anio_escolar)
);

CREATE TABLE la_preparatoria.cursos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  grado_id INT NOT NULL REFERENCES la_preparatoria.grados(id) ON DELETE CASCADE
);

CREATE TABLE la_preparatoria.docentes (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dni VARCHAR(15) UNIQUE,
  usuario_id INT UNIQUE REFERENCES la_preparatoria.usuarios(id) ON DELETE SET NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  especialidad VARCHAR(80)
);

CREATE TABLE la_preparatoria.horarios (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seccion_id INT NOT NULL REFERENCES la_preparatoria.secciones(id) ON DELETE CASCADE,
  curso_id INT NOT NULL REFERENCES la_preparatoria.cursos(id) ON DELETE CASCADE,
  docente_id INT REFERENCES la_preparatoria.docentes(id) ON DELETE SET NULL,
  dia_semana VARCHAR(10) NOT NULL CHECK (dia_semana IN ('Lunes','Martes','Miercoles','Jueves','Viernes')),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula VARCHAR(20)
);

-- ------------------------------------------------------------
-- Alumnos
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.alumnos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE REFERENCES la_preparatoria.usuarios(id) ON DELETE CASCADE,
  dni VARCHAR(15) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  sexo VARCHAR(1) CHECK (sexo IN ('M', 'F')),
  direccion VARCHAR(180),
  telefono VARCHAR(20),
  email VARCHAR(120),
  apoderado_nombre VARCHAR(150),
  apoderado_telefono VARCHAR(20),
  estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Matrículas (una por alumno y año escolar)
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.matriculas (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id INT NOT NULL REFERENCES la_preparatoria.alumnos(id) ON DELETE CASCADE,
  grado_id INT NOT NULL REFERENCES la_preparatoria.grados(id),
  seccion_id INT NOT NULL REFERENCES la_preparatoria.secciones(id),
  anio_escolar SMALLINT NOT NULL,
  fecha_matricula DATE NOT NULL,
  estado VARCHAR(11) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'retirado', 'trasladado')),
  monto_pago DECIMAL(10,2) DEFAULT 0,
  observaciones VARCHAR(255),
  UNIQUE (alumno_id, anio_escolar)
);

CREATE TABLE la_preparatoria.matriculas_historial (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  matricula_id INT NOT NULL REFERENCES la_preparatoria.matriculas(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(11) NOT NULL,
  estado_nuevo VARCHAR(11) NOT NULL,
  motivo VARCHAR(255),
  fecha DATE NOT NULL,
  usuario_id INT REFERENCES la_preparatoria.usuarios(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Asistencia
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.asistencias (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  horario_id INT NOT NULL REFERENCES la_preparatoria.horarios(id) ON DELETE CASCADE,
  alumno_id INT NOT NULL REFERENCES la_preparatoria.alumnos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado VARCHAR(12) NOT NULL DEFAULT 'presente' CHECK (estado IN ('presente', 'tardanza', 'falta', 'justificado')),
  observacion VARCHAR(255),
  registrado_por INT REFERENCES la_preparatoria.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (horario_id, alumno_id, fecha)
);

-- ------------------------------------------------------------
-- Notas
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.notas (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id INT NOT NULL REFERENCES la_preparatoria.alumnos(id) ON DELETE CASCADE,
  curso_id INT NOT NULL REFERENCES la_preparatoria.cursos(id) ON DELETE CASCADE,
  anio_escolar SMALLINT NOT NULL,
  periodo VARCHAR(30) NOT NULL,
  nota DECIMAL(4,2) NOT NULL,
  observacion VARCHAR(255),
  registrado_por INT REFERENCES la_preparatoria.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alumno_id, curso_id, anio_escolar, periodo)
);

CREATE OR REPLACE FUNCTION la_preparatoria.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notas_set_updated_at
  BEFORE UPDATE ON la_preparatoria.notas
  FOR EACH ROW EXECUTE FUNCTION la_preparatoria.set_updated_at();

-- ------------------------------------------------------------
-- Avisos
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.avisos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  contenido TEXT NOT NULL,
  dirigido_a VARCHAR(10) NOT NULL DEFAULT 'todos' CHECK (dirigido_a IN ('todos', 'alumnos', 'docentes')),
  publicado_por INT REFERENCES la_preparatoria.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Auditoría
-- ------------------------------------------------------------
CREATE TABLE la_preparatoria.auditoria (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id INT REFERENCES la_preparatoria.usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT,
  detalle TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para las búsquedas más frecuentes
CREATE INDEX idx_alumnos_dni ON la_preparatoria.alumnos(dni);
CREATE INDEX idx_matriculas_anio ON la_preparatoria.matriculas(anio_escolar);
CREATE INDEX idx_horarios_seccion ON la_preparatoria.horarios(seccion_id);
CREATE INDEX idx_asistencias_horario_fecha ON la_preparatoria.asistencias(horario_id, fecha);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Admin por defecto -> usuario: admin / clave: LaPreparatoria2026*
INSERT INTO la_preparatoria.usuarios (username, password_hash, rol, debe_cambiar_password) VALUES
('admin', '$2a$10$qdrYTnrVS0kj7BnGrVBJcOcLll.vkbGc0xl/WNcoODPu/F7YyfRzu', 'admin', FALSE);

INSERT INTO la_preparatoria.grados (nombre, nivel, orden) VALUES
('1er Grado', 'Primaria', 1), ('2do Grado', 'Primaria', 2), ('3er Grado', 'Primaria', 3),
('4to Grado', 'Primaria', 4), ('5to Grado', 'Primaria', 5), ('6to Grado', 'Primaria', 6),
('1er Grado', 'Secundaria', 7), ('2do Grado', 'Secundaria', 8), ('3er Grado', 'Secundaria', 9),
('4to Grado', 'Secundaria', 10), ('5to Grado', 'Secundaria', 11);

INSERT INTO la_preparatoria.secciones (grado_id, nombre, capacidad, anio_escolar)
SELECT id, 'A', 30, 2026 FROM la_preparatoria.grados;

INSERT INTO la_preparatoria.cursos (nombre, grado_id)
SELECT c.nombre, g.id
FROM la_preparatoria.grados g
CROSS JOIN (
  VALUES ('Comunicacion'), ('Matematica'), ('Personal Social'), ('Ciencia y Tecnologia'),
         ('Arte y Cultura'), ('Educacion Fisica'), ('Religion'), ('Ingles'), ('Tutoria')
) AS c(nombre)
WHERE g.nivel = 'Primaria';

INSERT INTO la_preparatoria.cursos (nombre, grado_id)
SELECT c.nombre, g.id
FROM la_preparatoria.grados g
CROSS JOIN (
  VALUES ('Matematica'), ('Comunicacion'), ('Ingles'), ('Ciencia y Tecnologia'), ('Ciencias Sociales'),
         ('Desarrollo Personal, Ciudadania y Civica'), ('Educacion para el Trabajo'),
         ('Arte y Cultura'), ('Educacion Fisica'), ('Religion'), ('Tutoria')
) AS c(nombre)
WHERE g.nivel = 'Secundaria';

-- Docente de ejemplo, con cuenta de acceso (usuario: 44556677 / clave inicial: su DNI)
INSERT INTO la_preparatoria.usuarios (username, password_hash, rol, debe_cambiar_password) VALUES
('44556677', '$2a$10$XWF/WbHdFBUHV/lbfVExa.lSZpwB2I4BgH6rQhdbZ2RS.JpPKFKP2', 'docente', TRUE);

INSERT INTO la_preparatoria.docentes (dni, usuario_id, nombres, apellidos, especialidad)
SELECT '44556677', id, 'Rosa', 'Fernandez Quispe', 'Matematica' FROM la_preparatoria.usuarios WHERE username = '44556677';

RESET search_path;
