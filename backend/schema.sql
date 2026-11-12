-- Esquema MySQL 5.7+ / MariaDB 10.4+ para el catálogo de vinoteca.
-- Uso: mysql -u USUARIO -p NOMBRE_BASE < backend/schema.sql
-- Luego, opcionalmente: mysql -u USUARIO -p NOMBRE_BASE < backend/seed.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario       VARCHAR(60)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
  id                       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre                   VARCHAR(150)  NOT NULL,
  categoria                VARCHAR(30)   NOT NULL,
  es_caja                  TINYINT(1)    NOT NULL DEFAULT 0,
  presentacion             VARCHAR(50)   NULL,
  descripcion              TEXT          NULL,
  ficha_tecnica            JSON          NULL COMMENT '{ bodega, cepa, region, crianza, maridaje }',
  precio                   DECIMAL(10,2) NOT NULL,
  imagenes                 JSON          NULL COMMENT '["url", ...]',
  variantes                JSON          NULL COMMENT '[{ id, nombre, descripcion, precio|null }]',
  descuento_porcentaje     INT           NOT NULL DEFAULT 0,
  tipo_promocion           VARCHAR(30)   NOT NULL DEFAULT 'NONE' COMMENT 'NONE | 2X1 | 3X2 | 2DA_UNIDAD_DESCUENTO',
  descuento_segunda_unidad INT           NOT NULL DEFAULT 0,
  etiqueta                 VARCHAR(50)   NULL,
  activo                   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_productos_activo_categoria (activo, categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla auxiliar para limitar intentos de login por IP.
CREATE TABLE IF NOT EXISTS login_intentos (
  ip         VARCHAR(45) NOT NULL,
  intentos   INT         NOT NULL DEFAULT 0,
  ultimo     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Administrador inicial: usuario "admin", contraseña "cambiar-ya".
-- Cambiala apenas instales con: php backend/create_admin.php admin "NuevaClaveSegura"
INSERT IGNORE INTO admins (usuario, password_hash) VALUES
  ('admin', '$2y$10$W7otQl9NlmF7PMD.kyipzuCIJpCvT7rxUd0ypOpOlMY6twmyC7uw2');
