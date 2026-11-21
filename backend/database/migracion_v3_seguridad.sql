-- ============================================================
-- La Preparatoria — Migración v3: verificación en dos pasos (2FA) para admin
-- Correr en psql conectado a la base de datos de Railway.
-- ============================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dos_factor_secreto VARCHAR(64);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dos_factor_activo BOOLEAN NOT NULL DEFAULT FALSE;
