-- ============================================================
-- La Preparatoria — Migración v2: términos y condiciones
-- (las demás mejoras de esta tanda no requieren cambios de esquema)
-- ============================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS acepto_terminos BOOLEAN NOT NULL DEFAULT FALSE;

-- El admin y el docente de ejemplo ya existentes quedan sin aceptar; se les
-- pedirá aceptar en su próximo login, igual que a cualquier usuario nuevo.
