-- Únicos datos iniciales: catálogo de especies. No crea cuentas ni mascotas.
BEGIN;
INSERT INTO especies (codigo, nombre) VALUES
    ('perro', 'Perro'), ('gato', 'Gato'), ('conejo', 'Conejo'), ('ave', 'Ave'),
    ('roedor', 'Roedor'), ('reptil', 'Reptil'), ('pez', 'Pez'), ('otra', 'Otra')
ON CONFLICT (codigo) DO NOTHING;
COMMIT;
