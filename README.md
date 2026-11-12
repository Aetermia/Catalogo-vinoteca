# Catálogo Vinoteca

Plantilla de catálogo para vinotecas: verificación +18, ficha de cata, botellas y cajas cerradas, variantes, motor de promociones (% OFF, 2x1, 3x2, 2da unidad con %), cierre de pedido por WhatsApp y panel de administración.

**Stack:** React + Vite + CSS modular · PHP 8 + MySQL. Si la API no responde, la app pasa sola a **modo demo** (catálogo de `src/data/catalog.js` + `localStorage`).

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:5173  (modo demo si no hay PHP)
npm test         # tests del motor de precios y del mensaje de WhatsApp
npm run build    # genera dist/
```

Panel: `http://localhost:5173/#admin` (en modo demo hay acceso rápido).

Con backend local: `php -S localhost:8000 -t .` en la raíz (Vite proxea `/backend`), con `backend/config.php` creado y `'secure' => false`.

## Producción (hosting PHP/MySQL)

1. Crear la base e importar `backend/schema.sql` (y opcionalmente `backend/seed.sql`).
2. Copiar `backend/config.example.php` a `backend/config.php` con las credenciales.
3. Subir el contenido de `dist/` y la carpeta `backend/` a la misma raíz del dominio.
4. Ingresar en `/#admin` con `admin` / `cambiar-ya` y cambiar la clave: `php backend/create_admin.php admin "ClaveNueva"`.

## Adaptar a otro cliente

- Marca, WhatsApp, medios de pago y categorías: `src/data/config.js`
- Paleta y tipografía: `src/styles/tokens.css`
- Catálogo demo: `src/data/catalog.js` (regenerar seed con `node scripts/generate-seed.mjs`)
- Si cambiás categorías, actualizá también `CATEGORIAS` en `backend/helpers.php`.
