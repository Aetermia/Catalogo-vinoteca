// Genera backend/seed.sql a partir del catálogo demo (src/data/catalog.js).
// Uso: node scripts/generate-seed.mjs
import { writeFileSync } from 'node:fs';
import { catalog } from '../src/data/catalog.js';

const q = (v) => (v == null ? 'NULL' : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`);
const j = (v) => q(JSON.stringify(v));

const rows = catalog.map((p) =>
  `  (${[
    q(p.nombre), q(p.categoria), p.es_caja ? 1 : 0, q(p.presentacion), q(p.descripcion), j(p.ficha_tecnica),
    p.precio.toFixed(2), j(p.imagenes), j(p.variantes), p.descuento_porcentaje, q(p.tipo_promocion),
    p.descuento_segunda_unidad, q(p.etiqueta), p.activo ? 1 : 0,
  ].join(', ')})`,
);

const sql = `-- Datos iniciales generados desde src/data/catalog.js (node scripts/generate-seed.mjs).
-- Las imágenes apuntan a /img del frontend; reemplazalas desde el panel por fotos reales.
SET NAMES utf8mb4;

INSERT INTO productos
  (nombre, categoria, es_caja, presentacion, descripcion, ficha_tecnica, precio, imagenes, variantes,
   descuento_porcentaje, tipo_promocion, descuento_segunda_unidad, etiqueta, activo)
VALUES
${rows.join(',\n')};
`;

writeFileSync(new URL('../backend/seed.sql', import.meta.url), sql);
console.log(`backend/seed.sql generado con ${rows.length} productos.`);
