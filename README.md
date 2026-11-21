# La Preparatoria — Sistema Integral de Gestión Académica y Administrativa

Sistema web full-stack construido **desde cero** sobre PostgreSQL/Supabase
(sin ningún código heredado de versiones anteriores en MySQL): matrícula con
control de cupos, horarios, asistencia, notas, avisos, docentes con cuenta
propia, auditoría y reportes en PDF/CSV. Interfaz rediseñada con un sistema
visual más elaborado (paleta ampliada, iconografía, animaciones, gráficos).

**Stack:** Node.js + Express + PostgreSQL (backend, nativo para Supabase) ·
React + Vite + Tailwind (frontend) · JWT para autenticación.

---

## 1. Requisitos previos

- Node.js 18 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com) (recomendado), o PostgreSQL local

---

## 2. Base de datos (Supabase)

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor → New query**, pega todo el contenido de
   `backend/database/schema.sql` y dale **Run**. Esto crea todas las tablas
   y los datos iniciales (grados, secciones 2026, catálogo completo de
   cursos, el usuario administrador y un docente de ejemplo).
3. Ve a **Project Settings → Database → Connection string**, copia la cadena
   en modo **Transaction** (puerto 6543, mejor para apps serverless/con
   muchas conexiones cortas) o **Session** (puerto 5432).

Credenciales iniciales ya creadas por el seed:
- **Administrador:** usuario `admin` / clave `LaPreparatoria2026*`
- **Docente de ejemplo:** usuario `44556677` / clave `44556677`

---

## 3. Backend (API)

```bash
cd backend
npm install
cp .env.example .env
```

Pega en `.env` la cadena de conexión de Supabase en `DATABASE_URL`, y cambia
`JWT_SECRET` por una clave propia. Si prefieres correr PostgreSQL local en
vez de Supabase, deja `DATABASE_URL` vacío y completa las variables `DB_*`.

```bash
npm run dev
```

La API queda en `http://localhost:4000`. Pruébala en `/api/salud`.

---

## 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Si cambiaste el puerto del backend, crea
`frontend/.env` con `VITE_API_URL=http://localhost:TU_PUERTO/api`.

---

## 5. Primer uso

1. Entra con `admin` / `LaPreparatoria2026*`.
2. En **Docentes**, registra profesores y crea sus cuentas de acceso.
3. En **Nueva matrícula**, registra alumnos (respeta el cupo de cada sección).
4. En **Horarios**, arma el horario semanal de cada sección asignando curso,
   docente, día y hora — eso determina qué clases puede tomar asistencia y
   calificar cada docente.
5. El alumno y el docente entran con su DNI; la contraseña inicial es su
   propio DNI y el sistema les pide cambiarla en el primer ingreso.

---

## 6. Estructura del proyecto

```
backend/
  database/schema.sql        # esquema PostgreSQL completo + datos iniciales
  src/
    config/db.js              # conexión a PostgreSQL/Supabase
    middleware/                # auth, validación, rate limiting, errores
    controllers/                # auth, alumnos, matrículas, horarios, docentes,
                                 # asistencia, notas, avisos, auditoría, reportes, catálogo
    validators/esquemas.js      # validación con zod
    routes/                     # rutas Express
    utils/                      # logger, AppError, asyncHandler, csv, auditoría
    server.js                   # punto de entrada

frontend/
  src/
    api/axios.js                # cliente HTTP con token automático
    context/AuthContext.jsx     # sesión del usuario
    components/
      ui.jsx                     # Card, Badge, StatCard, EmptyState, PageHeader
      Shell.jsx                  # layout con barra lateral e iconos
      GrillaHorario.jsx          # horario semanal con chips a color
      Logo.jsx
    pages/
      alumno/  docente/  admin/
```

---

## 7. Robustez incluida

- Validación de datos con `zod` en todos los endpoints de escritura.
- Manejo de errores centralizado, con traducción de códigos de PostgreSQL
  (`23505` duplicados, `23503` llaves foráneas, etc.) a mensajes claros.
- Seguridad: `helmet`, rate limiting general y uno estricto solo para login.
- Logging estructurado con `pino`.
- El servidor prueba la conexión a la base de datos antes de escuchar
  peticiones, y se apaga de forma ordenada ante `SIGINT`/`SIGTERM`.
- *Error boundary* en el frontend.

## 8. Notas de seguridad para producción

- Cambia `JWT_SECRET` y la contraseña del usuario `admin`.
- Pon `NODE_ENV=production`.
- Ajusta `CORS_ORIGIN` al dominio real de tu frontend.
- Sirve el frontend compilado (`npm run build`) detrás de HTTPS (Vercel es
  una buena opción para esto — ver `frontend/vercel.json`).
