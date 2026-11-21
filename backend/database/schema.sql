-- ============================================================
-- La Preparatoria — Sistema Integral de Gestión Académica y Administrativa
-- Esquema PostgreSQL, para correr en el SQL Editor de Supabase
-- (Panel de Supabase -> SQL Editor -> New query -> pega todo -> Run)
-- ============================================================

-- ------------------------------------------------------------
-- Usuarios: login único para alumnos, docentes y administradores
-- ------------------------------------------------------------
CREATE TABLE usuarios (
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
CREATE TABLE grados (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  nivel VARCHAR(12) NOT NULL CHECK (nivel IN ('Inicial', 'Primaria', 'Secundaria')),
  orden INT NOT NULL DEFAULT 0
);

CREATE TABLE secciones (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grado_id INT NOT NULL REFERENCES grados(id) ON DELETE CASCADE,
  nombre VARCHAR(5) NOT NULL,
  capacidad INT NOT NULL DEFAULT 30,
  anio_escolar SMALLINT NOT NULL,
  UNIQUE (grado_id, nombre, anio_escolar)
);

CREATE TABLE cursos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  grado_id INT NOT NULL REFERENCES grados(id) ON DELETE CASCADE
);

CREATE TABLE docentes (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dni VARCHAR(15) UNIQUE,
  usuario_id INT UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  especialidad VARCHAR(80),
  foto_url VARCHAR(500)
);

CREATE TABLE horarios (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seccion_id INT NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  curso_id INT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  docente_id INT REFERENCES docentes(id) ON DELETE SET NULL,
  dia_semana VARCHAR(10) NOT NULL CHECK (dia_semana IN ('Lunes','Martes','Miercoles','Jueves','Viernes')),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula VARCHAR(20)
);

-- ------------------------------------------------------------
-- Alumnos
-- ------------------------------------------------------------
CREATE TABLE alumnos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
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
  foto_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Matrículas (una por alumno y año escolar)
-- ------------------------------------------------------------
CREATE TABLE matriculas (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  grado_id INT NOT NULL REFERENCES grados(id),
  seccion_id INT NOT NULL REFERENCES secciones(id),
  anio_escolar SMALLINT NOT NULL,
  fecha_matricula DATE NOT NULL,
  estado VARCHAR(11) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'retirado', 'trasladado')),
  monto_pago DECIMAL(10,2) DEFAULT 0,
  observaciones VARCHAR(255),
  UNIQUE (alumno_id, anio_escolar)
);

CREATE TABLE matriculas_historial (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  matricula_id INT NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(11) NOT NULL,
  estado_nuevo VARCHAR(11) NOT NULL,
  motivo VARCHAR(255),
  fecha DATE NOT NULL,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Asistencia
-- ------------------------------------------------------------
-- La asistencia se registra una vez por alumno por día (no por curso).
-- horario_id se conserva solo por compatibilidad con datos historicos.
CREATE TABLE asistencias (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  horario_id INT REFERENCES horarios(id) ON DELETE CASCADE,
  seccion_id INT REFERENCES secciones(id) ON DELETE CASCADE,
  alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado VARCHAR(12) NOT NULL DEFAULT 'presente' CHECK (estado IN ('presente', 'tardanza', 'falta', 'justificado')),
  observacion VARCHAR(255),
  registrado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT asistencias_seccion_o_horario_check CHECK (seccion_id IS NOT NULL OR horario_id IS NOT NULL)
);
CREATE UNIQUE INDEX asistencias_seccion_alumno_fecha_key ON asistencias (seccion_id, alumno_id, fecha) WHERE seccion_id IS NOT NULL;
CREATE INDEX idx_asistencias_seccion_fecha ON asistencias (seccion_id, fecha);

-- ------------------------------------------------------------
-- Notas
-- ------------------------------------------------------------
CREATE TABLE notas (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  curso_id INT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  anio_escolar SMALLINT NOT NULL,
  periodo VARCHAR(30) NOT NULL,
  nota DECIMAL(4,2) NOT NULL,
  observacion VARCHAR(255),
  registrado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alumno_id, curso_id, anio_escolar, periodo)
);

CREATE TABLE notas_historial (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nota_id INT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  nota_anterior DECIMAL(4,2) NOT NULL,
  observacion_anterior VARCHAR(255),
  modificado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  modificado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notas_historial_nota ON notas_historial (nota_id, modificado_en DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notas_set_updated_at
  BEFORE UPDATE ON notas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Avisos
-- ------------------------------------------------------------
CREATE TABLE avisos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  contenido TEXT NOT NULL,
  dirigido_a VARCHAR(10) NOT NULL DEFAULT 'todos' CHECK (dirigido_a IN ('todos', 'alumnos', 'docentes')),
  publicado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE avisos_comentarios (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aviso_id INT NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  contenido VARCHAR(500) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_avisos_comentarios_aviso ON avisos_comentarios (aviso_id, creado_en);

-- ------------------------------------------------------------
-- Auditoría
-- ------------------------------------------------------------
CREATE TABLE auditoria (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT,
  detalle TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Calendario académico e incidencias de conducta
-- ------------------------------------------------------------
CREATE TABLE calendario_academico (
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
CREATE INDEX idx_calendario_fechas ON calendario_academico (fecha_inicio, fecha_fin);
CREATE INDEX idx_calendario_anio ON calendario_academico (anio_escolar);

CREATE TABLE incidencias (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('positiva', 'leve', 'moderada', 'grave')),
  descripcion VARCHAR(500) NOT NULL,
  registrado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidencias_alumno ON incidencias (alumno_id, creado_en DESC);

-- Índices para las búsquedas más frecuentes
CREATE INDEX idx_alumnos_dni ON alumnos(dni);
CREATE INDEX idx_matriculas_anio ON matriculas(anio_escolar);
CREATE INDEX idx_horarios_seccion ON horarios(seccion_id);
CREATE INDEX idx_asistencias_horario_fecha ON asistencias(horario_id, fecha);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Admin por defecto -> usuario: admin / clave: LaPreparatoria2026*
INSERT INTO usuarios (username, password_hash, rol, debe_cambiar_password) VALUES
('admin', '$2a$10$qdrYTnrVS0kj7BnGrVBJcOcLll.vkbGc0xl/WNcoODPu/F7YyfRzu', 'admin', FALSE);

INSERT INTO grados (nombre, nivel, orden) VALUES
('1er Grado', 'Primaria', 1), ('2do Grado', 'Primaria', 2), ('3er Grado', 'Primaria', 3),
('4to Grado', 'Primaria', 4), ('5to Grado', 'Primaria', 5), ('6to Grado', 'Primaria', 6),
('1er Grado', 'Secundaria', 7), ('2do Grado', 'Secundaria', 8), ('3er Grado', 'Secundaria', 9),
('4to Grado', 'Secundaria', 10), ('5to Grado', 'Secundaria', 11);

INSERT INTO secciones (grado_id, nombre, capacidad, anio_escolar)
SELECT id, 'A', 30, 2026 FROM grados;

INSERT INTO cursos (nombre, grado_id)
SELECT c.nombre, g.id
FROM grados g
CROSS JOIN (
  VALUES ('Comunicacion'), ('Matematica'), ('Personal Social'), ('Ciencia y Tecnologia'),
         ('Arte y Cultura'), ('Educacion Fisica'), ('Religion'), ('Ingles'), ('Tutoria')
) AS c(nombre)
WHERE g.nivel = 'Primaria';

INSERT INTO cursos (nombre, grado_id)
SELECT c.nombre, g.id
FROM grados g
CROSS JOIN (
  VALUES ('Matematica'), ('Comunicacion'), ('Ingles'), ('Ciencia y Tecnologia'), ('Ciencias Sociales'),
         ('Desarrollo Personal, Ciudadania y Civica'), ('Educacion para el Trabajo'),
         ('Arte y Cultura'), ('Educacion Fisica'), ('Religion'), ('Tutoria')
) AS c(nombre)
WHERE g.nivel = 'Secundaria';

-- Docente de ejemplo, con cuenta de acceso (usuario: 44556677 / clave inicial: su DNI)
INSERT INTO usuarios (username, password_hash, rol, debe_cambiar_password) VALUES
('44556677', '$2a$10$XWF/WbHdFBUHV/lbfVExa.lSZpwB2I4BgH6rQhdbZ2RS.JpPKFKP2', 'docente', TRUE);

INSERT INTO docentes (dni, usuario_id, nombres, apellidos, especialidad)
SELECT '44556677', id, 'Rosa', 'Fernandez Quispe', 'Matematica' FROM usuarios WHERE username = '44556677';
