<?php
declare(strict_types=1);

function app_config(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/config.php';
        if (!is_file($file)) {
            json_error('Backend sin configurar: falta backend/config.php', 503);
        }
        $config = require $file;
    }
    return $config;
}

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['ok' => $status < 400, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400, array $details = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    $body = ['ok' => false, 'error' => $message];
    if ($details) {
        $body['details'] = $details;
    }
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Método HTTP efectivo (permite override para hostings que bloquean PUT/DELETE). */
function request_method(): string
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($method === 'POST') {
        $override = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? ($_GET['_method'] ?? ''));
        if (in_array($override, ['PUT', 'DELETE'], true)) {
            return $override;
        }
    }
    return $method;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_error('JSON inválido en el cuerpo de la solicitud.', 400);
    }
    return $data;
}

/** Mitigación CSRF: las mutaciones deben venir del frontend (header custom => preflight CORS). */
function require_ajax_header(): void
{
    if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'XMLHttpRequest') {
        json_error('Solicitud no permitida.', 403);
    }
}

function str_field(array $src, string $key, int $max, string $default = ''): string
{
    $value = isset($src[$key]) && is_scalar($src[$key]) ? trim((string) $src[$key]) : $default;
    return mb_substr($value, 0, $max);
}

const CATEGORIAS = ['tintos', 'blancos', 'rosados', 'espumantes', 'destilados', 'cajas'];
const PROMOCIONES = ['NONE', '2X1', '3X2', '2DA_UNIDAD_DESCUENTO'];

/** Valida y normaliza el payload de un producto. Devuelve [datos, errores]. */
function sanitize_product(array $in): array
{
    $errors = [];

    $nombre = str_field($in, 'nombre', 150);
    if ($nombre === '') {
        $errors['nombre'] = 'El nombre es obligatorio.';
    }

    $categoria = str_field($in, 'categoria', 30);
    if (!in_array($categoria, CATEGORIAS, true)) {
        $errors['categoria'] = 'Categoría inválida.';
    }

    $precio = isset($in['precio']) && is_numeric($in['precio']) ? round((float) $in['precio'], 2) : 0.0;
    if ($precio <= 0 || $precio > 99999999) {
        $errors['precio'] = 'Precio inválido.';
    }

    $descuento = isset($in['descuento_porcentaje']) ? (int) $in['descuento_porcentaje'] : 0;
    if ($descuento < 0 || $descuento > 90) {
        $errors['descuento_porcentaje'] = 'El descuento debe estar entre 0 y 90.';
    }

    $promo = strtoupper(str_field($in, 'tipo_promocion', 30, 'NONE'));
    if (!in_array($promo, PROMOCIONES, true)) {
        $errors['tipo_promocion'] = 'Tipo de promoción inválido.';
    }

    $segunda = isset($in['descuento_segunda_unidad']) ? (int) $in['descuento_segunda_unidad'] : 0;
    if ($promo === '2DA_UNIDAD_DESCUENTO' && ($segunda < 1 || $segunda > 100)) {
        $errors['descuento_segunda_unidad'] = 'Debe estar entre 1 y 100.';
    }
    if ($promo !== '2DA_UNIDAD_DESCUENTO') {
        $segunda = 0;
    }

    $fichaIn = is_array($in['ficha_tecnica'] ?? null) ? $in['ficha_tecnica'] : [];
    $ficha = [];
    foreach (['bodega', 'cepa', 'region', 'crianza', 'maridaje'] as $key) {
        $ficha[$key] = str_field($fichaIn, $key, 255);
    }

    $imagenes = [];
    foreach ((is_array($in['imagenes'] ?? null) ? $in['imagenes'] : []) as $url) {
        if (!is_string($url)) {
            continue;
        }
        $url = trim($url);
        // Se aceptan URLs http(s) y rutas relativas; se rechazan esquemas peligrosos (javascript:, data: grandes, etc.).
        if (preg_match('#^(https?://|/|img/)#i', $url) && strlen($url) <= 1000) {
            $imagenes[] = $url;
        }
    }
    $imagenes = array_slice($imagenes, 0, 12);

    $variantes = [];
    foreach ((is_array($in['variantes'] ?? null) ? $in['variantes'] : []) as $i => $v) {
        if (!is_array($v)) {
            continue;
        }
        $vNombre = str_field($v, 'nombre', 100);
        if ($vNombre === '') {
            $errors["variante_$i"] = 'Cada variante necesita un nombre.';
            continue;
        }
        $vPrecio = isset($v['precio']) && is_numeric($v['precio']) && (float) $v['precio'] > 0 ? round((float) $v['precio'], 2) : null;
        $variantes[] = [
            'id'          => str_field($v, 'id', 40) ?: 'v-' . bin2hex(random_bytes(4)),
            'nombre'      => $vNombre,
            'descripcion' => str_field($v, 'descripcion', 255),
            'precio'      => $vPrecio,
        ];
    }
    $variantes = array_slice($variantes, 0, 20);

    $etiqueta = str_field($in, 'etiqueta', 50);

    $data = [
        'nombre'                   => $nombre,
        'categoria'                => $categoria,
        'es_caja'                  => !empty($in['es_caja']) ? 1 : 0,
        'presentacion'             => str_field($in, 'presentacion', 50),
        'descripcion'              => str_field($in, 'descripcion', 5000),
        'ficha_tecnica'            => json_encode($ficha, JSON_UNESCAPED_UNICODE),
        'precio'                   => $precio,
        'imagenes'                 => json_encode($imagenes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'variantes'                => json_encode($variantes, JSON_UNESCAPED_UNICODE),
        'descuento_porcentaje'     => $descuento,
        'tipo_promocion'           => $promo,
        'descuento_segunda_unidad' => $segunda,
        'etiqueta'                 => $etiqueta === '' ? null : $etiqueta,
        'activo'                   => array_key_exists('activo', $in) ? (!empty($in['activo']) ? 1 : 0) : 1,
    ];

    return [$data, $errors];
}

/** Convierte una fila de la base al formato que consume el frontend. */
function decode_product(array $row): array
{
    $decode = static function ($value, $fallback) {
        if ($value === null || $value === '') {
            return $fallback;
        }
        $decoded = json_decode((string) $value, true);
        return is_array($decoded) ? $decoded : $fallback;
    };

    return [
        'id'                       => (int) $row['id'],
        'nombre'                   => $row['nombre'],
        'categoria'                => $row['categoria'],
        'es_caja'                  => (bool) $row['es_caja'],
        'presentacion'             => $row['presentacion'] ?? '',
        'descripcion'              => $row['descripcion'] ?? '',
        'ficha_tecnica'            => (object) $decode($row['ficha_tecnica'], []),
        'precio'                   => (float) $row['precio'],
        'imagenes'                 => $decode($row['imagenes'], []),
        'variantes'                => $decode($row['variantes'], []),
        'descuento_porcentaje'     => (int) $row['descuento_porcentaje'],
        'tipo_promocion'           => $row['tipo_promocion'],
        'descuento_segunda_unidad' => (int) $row['descuento_segunda_unidad'],
        'etiqueta'                 => $row['etiqueta'],
        'activo'                   => (bool) $row['activo'],
        'created_at'               => $row['created_at'] ?? null,
    ];
}
