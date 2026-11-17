-- PostgreSQL 17+. Ejecutar en gestion_mascotas, después de 00_crear_base_de_datos.sql.
-- Inicialización de una base VACÍA. Falla y revierte ante cualquier error.
-- No contiene DROP, migraciones Laravel ni usuarios/contraseñas de ejemplo.
BEGIN;
SET LOCAL TIME ZONE 'UTC';

CREATE TABLE usuarios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre varchar(100) NOT NULL CHECK (length(btrim(nombre)) > 0),
    correo varchar(254) NOT NULL CHECK (correo = lower(btrim(correo))),
    contrasena varchar(255) NOT NULL,
    correo_verificado_en timestamptz,
    token_recuerdo varchar(100),
    recuperacion_hash char(64),
    version_sesion integer NOT NULL DEFAULT 1 CHECK (version_sesion > 0),
    eliminado_en timestamptz,
    zona_horaria varchar(100) NOT NULL DEFAULT 'Europe/Madrid',
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_correo_unico UNIQUE (correo)
);

CREATE TABLE especies (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo varchar(40) NOT NULL UNIQUE,
    nombre varchar(80) NOT NULL CHECK (length(btrim(nombre)) > 0),
    habilitada boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX especies_nombre_unico ON especies (lower(btrim(nombre)));

CREATE TABLE mascotas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    propietario_id bigint NOT NULL REFERENCES usuarios(id),
    creador_id bigint NOT NULL REFERENCES usuarios(id),
    especie_id bigint NOT NULL REFERENCES especies(id),
    otra_especie varchar(80),
    nombre varchar(60) NOT NULL CHECK (length(btrim(nombre)) BETWEEN 1 AND 60),
    raza varchar(100),
    sexo varchar(20) CHECK (sexo IN ('macho', 'hembra', 'desconocido')),
    precision_nacimiento varchar(20) NOT NULL DEFAULT 'desconocida'
        CHECK (precision_nacimiento IN ('exacta', 'mes_anio', 'anio', 'desconocida')),
    anio_nacimiento smallint CHECK (anio_nacimiento BETWEEN 1 AND 9999),
    mes_nacimiento smallint CHECK (mes_nacimiento BETWEEN 1 AND 12),
    dia_nacimiento smallint CHECK (dia_nacimiento BETWEEN 1 AND 31),
    peso_actual_kg numeric(10,3) CHECK (peso_actual_kg > 0),
    esterilizacion varchar(20) NOT NULL DEFAULT 'desconocido' CHECK (esterilizacion IN ('si', 'no', 'desconocido')),
    microchip varchar(30),
    color_caracteristicas varchar(150),
    observaciones varchar(1000),
    foto_ruta varchar(500),
    zona_horaria varchar(100) NOT NULL DEFAULT 'Europe/Madrid',
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en timestamptz,
    CONSTRAINT nacimiento_componentes CHECK (
        (precision_nacimiento = 'desconocida' AND anio_nacimiento IS NULL AND mes_nacimiento IS NULL AND dia_nacimiento IS NULL) OR
        (precision_nacimiento = 'anio' AND anio_nacimiento IS NOT NULL AND mes_nacimiento IS NULL AND dia_nacimiento IS NULL) OR
        (precision_nacimiento = 'mes_anio' AND anio_nacimiento IS NOT NULL AND mes_nacimiento IS NOT NULL AND dia_nacimiento IS NULL) OR
        (precision_nacimiento = 'exacta' AND anio_nacimiento IS NOT NULL AND mes_nacimiento IS NOT NULL AND dia_nacimiento IS NOT NULL)
    )
);
CREATE INDEX mascotas_propietario_papelera ON mascotas(propietario_id, eliminado_en);

CREATE FUNCTION validar_ficha_mascota() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE codigo_especie text; fecha_conocida date;
BEGIN
    SELECT codigo INTO codigo_especie FROM especies WHERE id = NEW.especie_id;
    IF codigo_especie = 'otra' AND nullif(btrim(NEW.otra_especie), '') IS NULL THEN
        RAISE EXCEPTION 'Debe concretar la otra especie' USING ERRCODE = '23514';
    END IF;
    IF codigo_especie <> 'otra' AND NEW.otra_especie IS NOT NULL THEN
        RAISE EXCEPTION 'Otra especie solo se permite con el catálogo Otra' USING ERRCODE = '23514';
    END IF;
    IF NEW.anio_nacimiento IS NOT NULL THEN
        fecha_conocida := make_date(NEW.anio_nacimiento, coalesce(NEW.mes_nacimiento, 1), coalesce(NEW.dia_nacimiento, 1));
        IF fecha_conocida > (CURRENT_TIMESTAMP AT TIME ZONE NEW.zona_horaria)::date THEN
            RAISE EXCEPTION 'El nacimiento no puede ser futuro' USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER validar_ficha BEFORE INSERT OR UPDATE ON mascotas FOR EACH ROW EXECUTE FUNCTION validar_ficha_mascota();

CREATE TABLE colaboradores_mascota (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    usuario_id bigint NOT NULL REFERENCES usuarios(id),
    permiso varchar(20) NOT NULL CHECK (permiso IN ('propietario', 'ayudante')),
    concedido_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revocado_en timestamptz,
    concedido_por_id bigint NOT NULL REFERENCES usuarios(id),
    revocado_por_id bigint REFERENCES usuarios(id),
    CHECK (revocado_en IS NULL OR revocado_en >= concedido_en)
);
CREATE UNIQUE INDEX colaboradores_activos_unicos ON colaboradores_mascota(mascota_id, usuario_id) WHERE revocado_en IS NULL;
CREATE INDEX colaboradores_usuario ON colaboradores_mascota(usuario_id) WHERE revocado_en IS NULL;

-- El propietario comparte un código de un solo uso, sin correo ni enlace.
-- Solo se conserva SHA-256 del código aleatorio de 16 caracteres.
CREATE TABLE codigos_colaboracion (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    permiso varchar(20) NOT NULL CHECK (permiso IN ('propietario', 'ayudante')),
    codigo_hash char(64) NOT NULL UNIQUE,
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    caduca_en timestamptz NOT NULL DEFAULT (CURRENT_TIMESTAMP + interval '20 minutes'),
    usado_en timestamptz,
    usado_por_id bigint REFERENCES usuarios(id),
    cancelado_en timestamptz,
    CHECK (caduca_en > creado_en),
    CHECK ((usado_en IS NULL AND usado_por_id IS NULL) OR (usado_en IS NOT NULL AND usado_por_id IS NOT NULL)),
    CHECK (usado_en IS NULL OR cancelado_en IS NULL)
);
CREATE INDEX codigos_mascota ON codigos_colaboracion(mascota_id, creado_en);
CREATE INDEX codigos_pendientes ON codigos_colaboracion(caduca_en) WHERE usado_en IS NULL AND cancelado_en IS NULL;

CREATE TABLE transferencias_propiedad (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    propietario_origen_id bigint NOT NULL REFERENCES usuarios(id),
    propietario_destino_id bigint NOT NULL REFERENCES usuarios(id),
    estado varchar(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aceptada','rechazada','cancelada')),
    solicitada_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelta_en timestamptz,
    CHECK (propietario_origen_id <> propietario_destino_id),
    CHECK ((estado = 'pendiente' AND resuelta_en IS NULL) OR (estado <> 'pendiente' AND resuelta_en IS NOT NULL))
);
CREATE UNIQUE INDEX transferencia_pendiente_unica ON transferencias_propiedad(mascota_id) WHERE estado = 'pendiente';

CREATE TABLE consultas_veterinarias (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    fecha_consulta date NOT NULL,
    motivo varchar(500) NOT NULL CHECK (length(btrim(motivo)) > 0),
    clinica_veterinario varchar(200), diagnostico text, recomendaciones text, observaciones text,
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    actualizado_por_id bigint REFERENCES usuarios(id), eliminado_por_id bigint REFERENCES usuarios(id),
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, eliminado_en timestamptz,
    UNIQUE(id, mascota_id)
);
CREATE TABLE vacunas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    nombre varchar(150) NOT NULL CHECK (length(btrim(nombre)) > 0),
    fecha_administracion date NOT NULL,
    proxima_dosis_fecha date CHECK (proxima_dosis_fecha > fecha_administracion),
    clinica_veterinario varchar(200), numero_lote varchar(100), observaciones text,
    vacuna_anterior_id bigint, prevision_atendida_en timestamptz,
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    actualizado_por_id bigint REFERENCES usuarios(id), eliminado_por_id bigint REFERENCES usuarios(id),
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, eliminado_en timestamptz,
    UNIQUE(id, mascota_id),
    FOREIGN KEY (vacuna_anterior_id, mascota_id) REFERENCES vacunas(id, mascota_id),
    CHECK (vacuna_anterior_id IS NULL OR vacuna_anterior_id <> id),
    CHECK (prevision_atendida_en IS NULL OR proxima_dosis_fecha IS NOT NULL)
);
CREATE UNIQUE INDEX vacuna_siguiente_unica ON vacunas(vacuna_anterior_id) WHERE vacuna_anterior_id IS NOT NULL;
CREATE TABLE desparasitaciones (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    producto varchar(150) NOT NULL CHECK (length(btrim(producto)) > 0),
    fecha_aplicacion date NOT NULL,
    tipo varchar(20) NOT NULL CHECK (tipo IN ('interna','externa','ambas')),
    proxima_aplicacion_fecha date CHECK (proxima_aplicacion_fecha > fecha_aplicacion),
    desparasitacion_anterior_id bigint, prevision_atendida_en timestamptz, observaciones text,
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    actualizado_por_id bigint REFERENCES usuarios(id), eliminado_por_id bigint REFERENCES usuarios(id),
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, eliminado_en timestamptz,
    UNIQUE(id, mascota_id),
    FOREIGN KEY (desparasitacion_anterior_id, mascota_id) REFERENCES desparasitaciones(id, mascota_id),
    CHECK (desparasitacion_anterior_id IS NULL OR desparasitacion_anterior_id <> id),
    CHECK (prevision_atendida_en IS NULL OR proxima_aplicacion_fecha IS NOT NULL)
);
CREATE UNIQUE INDEX desparasitacion_siguiente_unica ON desparasitaciones(desparasitacion_anterior_id) WHERE desparasitacion_anterior_id IS NOT NULL;
CREATE TABLE alergias (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    alergeno varchar(150) NOT NULL CHECK (length(btrim(alergeno)) > 0),
    alergeno_normalizado text GENERATED ALWAYS AS (lower(regexp_replace(btrim(alergeno), '\s+', ' ', 'g'))) STORED,
    tipo varchar(100), sintomas text, gravedad varchar(50), fecha_deteccion date, observaciones text,
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    actualizado_por_id bigint REFERENCES usuarios(id), eliminado_por_id bigint REFERENCES usuarios(id),
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, eliminado_en timestamptz
);
CREATE UNIQUE INDEX alergia_activa_unica ON alergias(mascota_id, alergeno_normalizado) WHERE eliminado_en IS NULL;
CREATE INDEX consultas_cronologia ON consultas_veterinarias(mascota_id, fecha_consulta);
CREATE INDEX vacunas_cronologia ON vacunas(mascota_id, fecha_administracion);
CREATE INDEX desparasitaciones_cronologia ON desparasitaciones(mascota_id, fecha_aplicacion);

-- Las fechas realizadas se comparan con el día local de la mascota en cada escritura.
CREATE FUNCTION validar_fecha_sanitaria() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE fecha date; zona text;
BEGIN
    fecha := (to_jsonb(NEW) ->> TG_ARGV[0])::date;
    SELECT zona_horaria INTO zona FROM mascotas WHERE id = NEW.mascota_id;
    IF fecha > (CURRENT_TIMESTAMP AT TIME ZONE zona)::date THEN
        RAISE EXCEPTION 'Una actuación realizada no puede tener fecha futura' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER fecha_consulta_valida BEFORE INSERT OR UPDATE ON consultas_veterinarias FOR EACH ROW EXECUTE FUNCTION validar_fecha_sanitaria('fecha_consulta');
CREATE TRIGGER fecha_vacuna_valida BEFORE INSERT OR UPDATE ON vacunas FOR EACH ROW EXECUTE FUNCTION validar_fecha_sanitaria('fecha_administracion');
CREATE TRIGGER fecha_desparasitacion_valida BEFORE INSERT OR UPDATE ON desparasitaciones FOR EACH ROW EXECUTE FUNCTION validar_fecha_sanitaria('fecha_aplicacion');
CREATE TRIGGER fecha_alergia_valida BEFORE INSERT OR UPDATE ON alergias FOR EACH ROW EXECUTE FUNCTION validar_fecha_sanitaria('fecha_deteccion');

CREATE TABLE tratamientos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    nombre varchar(150) NOT NULL CHECK (length(btrim(nombre)) > 0),
    tipo varchar(20) NOT NULL CHECK (tipo IN ('medicamento','cuidado')),
    estado varchar(20) NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso','finalizado','cancelado')),
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    motivo_cancelacion text,
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalizado_en timestamptz, cancelado_en timestamptz, eliminado_en timestamptz,
    CHECK (estado <> 'cancelado' OR (cancelado_en IS NOT NULL AND nullif(btrim(motivo_cancelacion), '') IS NOT NULL)),
    CHECK (estado <> 'finalizado' OR finalizado_en IS NOT NULL)
);
CREATE FUNCTION horarios_validos(horarios jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE hora text;
BEGIN
    IF jsonb_typeof(horarios) <> 'array' THEN RETURN false; END IF;
    IF jsonb_array_length(horarios) NOT BETWEEN 1 AND 24 THEN RETURN false; END IF;
    FOR hora IN SELECT jsonb_array_elements_text(horarios) LOOP
        IF hora IS NULL OR hora !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RETURN false; END IF;
    END LOOP;
    RETURN (SELECT count(DISTINCT valor) = jsonb_array_length(horarios) FROM jsonb_array_elements_text(horarios) AS h(valor));
END;
$$;
CREATE TABLE versiones_tratamiento (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tratamiento_id bigint NOT NULL REFERENCES tratamientos(id),
    numero_version integer NOT NULL CHECK (numero_version > 0),
    indicaciones text NOT NULL CHECK (length(btrim(indicaciones)) > 0),
    cantidad numeric(10,3) CHECK (cantidad > 0), unidad varchar(50), prescriptor varchar(200), observaciones text,
    fecha_inicio date NOT NULL, fecha_fin date CHECK (fecha_fin >= fecha_inicio),
    tipo_frecuencia varchar(20) NOT NULL CHECK (tipo_frecuencia IN ('diaria','cada_horas','dias_semana','unica')),
    intervalo_horas integer CHECK (intervalo_horas > 0),
    dias_semana jsonb, horarios jsonb,
    ancla_en timestamptz,
    zona_horaria varchar(100) NOT NULL DEFAULT 'Europe/Madrid',
    vigor_desde_en timestamptz NOT NULL, vigor_hasta_en timestamptz CHECK (vigor_hasta_en >= vigor_desde_en),
    creado_por_id bigint NOT NULL REFERENCES usuarios(id), motivo_cambio text,
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tratamiento_id, numero_version), UNIQUE(id, tratamiento_id),
    CHECK ((tipo_frecuencia = 'cada_horas' AND intervalo_horas IS NOT NULL) OR (tipo_frecuencia <> 'cada_horas' AND intervalo_horas IS NULL)),
    CHECK ((tipo_frecuencia = 'dias_semana' AND dias_semana IS NOT NULL AND jsonb_typeof(dias_semana) = 'array' AND jsonb_array_length(dias_semana) BETWEEN 1 AND 7 AND '[1,2,3,4,5,6,7]'::jsonb @> dias_semana) OR (tipo_frecuencia <> 'dias_semana' AND dias_semana IS NULL)),
    CHECK ((tipo_frecuencia IN ('diaria','dias_semana','unica') AND horarios IS NOT NULL AND horarios_validos(horarios)) OR (tipo_frecuencia = 'cada_horas' AND horarios IS NULL)),
    CHECK (tipo_frecuencia <> 'unica' OR (fecha_fin IS NOT NULL AND fecha_fin = fecha_inicio AND jsonb_array_length(horarios) = 1)),
    CHECK ((tipo_frecuencia = 'cada_horas' AND ancla_en IS NOT NULL) OR (tipo_frecuencia <> 'cada_horas' AND ancla_en IS NULL)),
    CHECK (cantidad IS NULL OR nullif(btrim(unidad), '') IS NOT NULL)
);
CREATE UNIQUE INDEX version_abierta_unica ON versiones_tratamiento(tratamiento_id) WHERE vigor_hasta_en IS NULL;
CREATE FUNCTION validar_cantidad_tratamiento() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM tratamientos WHERE id = NEW.tratamiento_id AND tipo = 'medicamento') AND NEW.cantidad IS NULL THEN
        RAISE EXCEPTION 'Los medicamentos requieren cantidad y unidad' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER cantidad_tratamiento_valida BEFORE INSERT OR UPDATE ON versiones_tratamiento FOR EACH ROW EXECUTE FUNCTION validar_cantidad_tratamiento();
CREATE TABLE resoluciones_dosis (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tratamiento_id bigint NOT NULL REFERENCES tratamientos(id),
    version_tratamiento_id bigint NOT NULL,
    dosis_clave varchar(160) NOT NULL UNIQUE,
    fecha_hora_programada timestamptz NOT NULL,
    estado varchar(20) NOT NULL CHECK (estado IN ('administrada','omitida')),
    fecha_hora_real timestamptz,
    cantidad_real numeric(10,3) CHECK (cantidad_real > 0), unidad_real varchar(50),
    registrado_por_id bigint NOT NULL REFERENCES usuarios(id),
    realizado_por_usuario_id bigint REFERENCES usuarios(id), realizado_por_nombre varchar(100),
    observaciones text, motivo_omision text, motivo_correccion text,
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_tratamiento_id, tratamiento_id) REFERENCES versiones_tratamiento(id, tratamiento_id),
    UNIQUE (tratamiento_id, fecha_hora_programada),
    CHECK ((estado = 'administrada' AND fecha_hora_real IS NOT NULL) OR (estado = 'omitida' AND fecha_hora_real IS NULL)),
    CHECK (realizado_por_usuario_id IS NULL OR realizado_por_nombre IS NULL)
);
CREATE FUNCTION validar_instante_real() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.fecha_hora_real > CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'La administración no puede ser futura' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER instante_real_valido BEFORE INSERT OR UPDATE ON resoluciones_dosis FOR EACH ROW EXECUTE FUNCTION validar_instante_real();
CREATE INDEX tratamientos_mascota_estado ON tratamientos(mascota_id, estado);

CREATE TABLE citas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    titulo varchar(150) NOT NULL CHECK (length(btrim(titulo)) > 0), descripcion text,
    fecha_hora_inicio timestamptz NOT NULL, lugar varchar(200),
    estado varchar(20) NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada','realizada','cancelada')),
    consulta_veterinaria_id bigint,
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, eliminado_en timestamptz,
    FOREIGN KEY (consulta_veterinaria_id, mascota_id) REFERENCES consultas_veterinarias(id, mascota_id)
);
CREATE TABLE tareas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id),
    titulo varchar(150) NOT NULL CHECK (length(btrim(titulo)) > 0), descripcion text,
    fecha_hora_programada timestamptz NOT NULL,
    responsable_id bigint REFERENCES usuarios(id),
    estado varchar(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completada','cancelada')),
    creado_por_id bigint NOT NULL REFERENCES usuarios(id),
    completado_por_id bigint REFERENCES usuarios(id), completado_en timestamptz, cancelado_en timestamptz,
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, eliminado_en timestamptz,
    CHECK (estado <> 'completada' OR (completado_por_id IS NOT NULL AND completado_en IS NOT NULL)),
    CHECK (estado <> 'cancelada' OR cancelado_en IS NOT NULL)
);
CREATE INDEX citas_agenda ON citas(mascota_id, fecha_hora_inicio);
CREATE INDEX tareas_agenda ON tareas(mascota_id, fecha_hora_programada);

CREATE TABLE auditoria_cambios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mascota_id bigint REFERENCES mascotas(id),
    entidad_tipo varchar(80) NOT NULL, entidad_id bigint NOT NULL,
    accion varchar(40) NOT NULL, usuario_id bigint REFERENCES usuarios(id),
    motivo text, valores_anteriores jsonb, valores_nuevos jsonb,
    ocurrido_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, metadatos jsonb,
    CHECK (accion <> 'correccion' OR nullif(btrim(motivo), '') IS NOT NULL)
);
CREATE INDEX auditoria_entidad ON auditoria_cambios(entidad_tipo, entidad_id, ocurrido_en);
CREATE INDEX auditoria_mascota ON auditoria_cambios(mascota_id, ocurrido_en);

-- Las sesiones y caché iniciales usan archivos; Sanctum SPA no necesita tokens personales.
-- Estructura heredada reservada; la aplicación no ofrece recuperación de contraseña.
CREATE TABLE tokens_recuperacion (
    correo varchar(254) PRIMARY KEY REFERENCES usuarios(correo),
    token_hash varchar(255) NOT NULL,
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE FUNCTION actualizar_marca_temporal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
DO $$
DECLARE tabla text;
BEGIN
    FOREACH tabla IN ARRAY ARRAY['usuarios','mascotas','consultas_veterinarias','vacunas','desparasitaciones','alergias','tratamientos','resoluciones_dosis','citas','tareas'] LOOP
        EXECUTE format('CREATE TRIGGER actualizar_marca BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION actualizar_marca_temporal()', tabla);
    END LOOP;
END;
$$;
COMMIT;
