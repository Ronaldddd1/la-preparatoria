const { z } = require('zod');

// ---- Auth ----
const loginSchema = z.object({
  username: z.string().trim().min(1, 'El usuario es obligatorio.').max(50),
  password: z.string().min(1, 'La contrasena es obligatoria.').max(100),
  codigo: z.string().trim().max(10).nullish().or(z.literal('')),
});

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contrasena actual es obligatoria.'),
  passwordNueva: z.string().min(6, 'La nueva contrasena debe tener al menos 6 caracteres.').max(100),
});

const codigoDosFactorSchema = z.object({
  codigo: z.string().trim().regex(/^[0-9]{6}$/, 'Ingresa el código de 6 dígitos.'),
});

// ---- Alumnos ----
const actualizarAlumnoSchema = z.object({
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  fechaNacimiento: z.string().date().nullish().or(z.literal('')),
  sexo: z.enum(['M', 'F']).nullish().or(z.literal('')),
  direccion: z.string().max(180).nullish().or(z.literal('')),
  telefono: z.string().max(20).nullish().or(z.literal('')),
  email: z.string().email('Correo invalido.').max(120).nullish().or(z.literal('')),
  apoderadoNombre: z.string().max(150).nullish().or(z.literal('')),
  apoderadoTelefono: z.string().max(20).nullish().or(z.literal('')),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

const actualizarMiPerfilSchema = z.object({
  direccion: z.string().max(180).nullish().or(z.literal('')),
  telefono: z.string().max(20).nullish().or(z.literal('')),
  email: z.string().email('Correo invalido.').max(120).nullish().or(z.literal('')),
});

// ---- Matriculas ----
const crearMatriculaSchema = z.object({
  dni: z.string().regex(/^[0-9]{8}$/, 'El DNI debe tener 8 digitos.'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.').max(100),
  fechaNacimiento: z.string().date().nullish().or(z.literal('')),
  sexo: z.enum(['M', 'F']).nullish().or(z.literal('')),
  direccion: z.string().max(180).nullish().or(z.literal('')),
  telefono: z.string().max(20).nullish().or(z.literal('')),
  email: z.string().email('Correo invalido.').max(120).nullish().or(z.literal('')),
  apoderadoNombre: z.string().max(150).nullish().or(z.literal('')),
  apoderadoTelefono: z.string().max(20).nullish().or(z.literal('')),
  gradoId: z.coerce.number().int().positive('Selecciona un grado.'),
  seccionId: z.coerce.number().int().positive('Selecciona una seccion.'),
  anioEscolar: z.coerce.number().int().min(2020).max(2100),
  montoPago: z.coerce.number().min(0).optional(),
  observaciones: z.string().max(255).nullish().or(z.literal('')),
});

const renovarMatriculaSchema = z.object({
  gradoId: z.coerce.number().int().positive('Selecciona un grado.'),
  seccionId: z.coerce.number().int().positive('Selecciona una seccion.'),
  anioEscolar: z.coerce.number().int().min(2020).max(2100),
  montoPago: z.coerce.number().min(0).optional(),
  observaciones: z.string().max(255).nullish().or(z.literal('')),
});

const actualizarMatriculaSchema = z.object({
  seccionId: z.coerce.number().int().positive().optional(),
  estado: z.enum(['activo', 'retirado', 'trasladado']).optional(),
  motivo: z.string().max(255).nullish().or(z.literal('')),
  observaciones: z.string().max(255).nullish(),
  montoPago: z.coerce.number().min(0).nullish(),
});

// ---- Horarios ----
const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const crearHorarioSchema = z.object({
  seccionId: z.coerce.number().int().positive('Selecciona una seccion.'),
  cursoId: z.coerce.number().int().positive('Selecciona un curso.'),
  docenteId: z.coerce.number().int().positive().nullish(),
  diaSemana: z.enum(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']),
  horaInicio: z.string().regex(horaRegex, 'Hora de inicio invalida.'),
  horaFin: z.string().regex(horaRegex, 'Hora de fin invalida.'),
  aula: z.string().max(20).nullish().or(z.literal('')),
}).refine((d) => d.horaInicio < d.horaFin, { message: 'La hora de inicio debe ser antes que la hora de fin.', path: ['horaFin'] });

const actualizarHorarioSchema = z.object({
  cursoId: z.coerce.number().int().positive('Selecciona un curso.'),
  docenteId: z.coerce.number().int().positive().nullish(),
  diaSemana: z.enum(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']),
  horaInicio: z.string().regex(horaRegex, 'Hora de inicio invalida.'),
  horaFin: z.string().regex(horaRegex, 'Hora de fin invalida.'),
  aula: z.string().max(20).nullish().or(z.literal('')),
}).refine((d) => d.horaInicio < d.horaFin, { message: 'La hora de inicio debe ser antes que la hora de fin.', path: ['horaFin'] });

// ---- Catalogo ----
const crearSeccionSchema = z.object({
  gradoId: z.coerce.number().int().positive('Selecciona un grado.'),
  nombre: z.string().trim().min(1).max(5),
  capacidad: z.coerce.number().int().positive().max(200).optional(),
  anioEscolar: z.coerce.number().int().min(2020).max(2100),
});

const crearCursoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre del curso es obligatorio.').max(80),
  gradoId: z.coerce.number().int().positive('Selecciona un grado.'),
});

// ---- Docentes ----
const crearDocenteSchema = z.object({
  dni: z.string().regex(/^[0-9]{8}$/, 'El DNI debe tener 8 digitos.').nullish().or(z.literal('')),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.').max(80),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.').max(80),
  especialidad: z.string().max(80).nullish().or(z.literal('')),
});
const actualizarDocenteSchema = crearDocenteSchema;

// ---- Asistencia ----
const registrarAsistenciaSchema = z.object({
  seccionId: z.coerce.number().int().positive('Selecciona una sección.'),
  fecha: z.string().date('Fecha invalida.'),
  registros: z.array(z.object({
    alumnoId: z.coerce.number().int().positive(),
    estado: z.enum(['presente', 'tardanza', 'falta', 'justificado']),
    observacion: z.string().max(255).nullish().or(z.literal('')),
  })).min(1, 'Debes registrar al menos un alumno.'),
});

// ---- Notas ----
const registrarNotaSchema = z.object({
  alumnoId: z.coerce.number().int().positive('Selecciona un alumno.'),
  cursoId: z.coerce.number().int().positive('Selecciona un curso.'),
  anioEscolar: z.coerce.number().int().min(2020).max(2100),
  periodo: z.string().trim().min(1, 'El periodo es obligatorio.').max(30),
  // Si se envían los 4 componentes, la nota se calcula en el servidor.
  nota: z.coerce.number().min(0, 'La nota minima es 0.').max(20, 'La nota maxima es 20.').optional(),
  promTareas: z.coerce.number().min(0).max(20).optional(),
  promPracticas: z.coerce.number().min(0).max(20).optional(),
  examen1: z.coerce.number().min(0).max(20).optional(),
  examen2: z.coerce.number().min(0).max(20).optional(),
  observacion: z.string().max(255).nullish().or(z.literal('')),
});

const ponderacionNotasSchema = z.object({
  pesoTareas: z.coerce.number().int().min(0).max(100),
  pesoPracticas: z.coerce.number().int().min(0).max(100),
  pesoExamen1: z.coerce.number().int().min(0).max(100),
  pesoExamen2: z.coerce.number().int().min(0).max(100),
}).refine((d) => d.pesoTareas + d.pesoPracticas + d.pesoExamen1 + d.pesoExamen2 === 100, {
  message: 'Los porcentajes deben sumar exactamente 100.',
});

// ---- Avisos ----
const crearAvisoSchema = z.object({
  titulo: z.string().trim().min(1, 'El titulo es obligatorio.').max(150),
  contenido: z.string().trim().min(1, 'El contenido es obligatorio.').max(4000),
  dirigidoA: z.enum(['todos', 'alumnos', 'docentes']).default('todos'),
});

// ---- Calendario académico ----
const crearEventoCalendarioSchema = z.object({
  titulo: z.string().trim().min(1, 'El titulo es obligatorio.').max(120),
  tipo: z.enum(['feriado', 'examen', 'inicio_bimestre', 'fin_bimestre', 'otro']),
  fechaInicio: z.string().date('Fecha de inicio invalida.'),
  fechaFin: z.string().date('Fecha de fin invalida.').nullish().or(z.literal('')),
  descripcion: z.string().max(255).nullish().or(z.literal('')),
  anioEscolar: z.coerce.number().int().min(2020).max(2100),
});

// ---- Incidencias de conducta ----
const crearIncidenciaSchema = z.object({
  alumnoId: z.coerce.number().int().positive('Selecciona un alumno.'),
  tipo: z.enum(['positiva', 'leve', 'moderada', 'grave']),
  descripcion: z.string().trim().min(1, 'La descripcion es obligatoria.').max(500),
});

// ---- Asistencia por QR ----
const marcarAsistenciaQrSchema = z.object({
  seccionId: z.coerce.number().int().positive(),
  fecha: z.string().date('Fecha invalida.'),
  dni: z.string().trim().min(1, 'Codigo QR invalido.').max(15),
});

module.exports = {
  loginSchema, cambiarPasswordSchema, codigoDosFactorSchema,
  actualizarAlumnoSchema, actualizarMiPerfilSchema,
  crearMatriculaSchema, renovarMatriculaSchema, actualizarMatriculaSchema,
  crearHorarioSchema, actualizarHorarioSchema,
  crearSeccionSchema, crearCursoSchema,
  crearDocenteSchema, actualizarDocenteSchema,
  registrarAsistenciaSchema, registrarNotaSchema, ponderacionNotasSchema, crearAvisoSchema,
  crearEventoCalendarioSchema, crearIncidenciaSchema, marcarAsistenciaQrSchema,
};
