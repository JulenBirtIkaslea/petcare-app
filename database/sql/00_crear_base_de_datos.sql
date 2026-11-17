-- Ejecutar conectado a postgres, fuera de una transacción y con permiso CREATEDB.
-- No elimina ni reemplaza una base existente. Si ya existe, omitir este archivo.
CREATE DATABASE gestion_mascotas WITH ENCODING = 'UTF8' TEMPLATE = template0;
