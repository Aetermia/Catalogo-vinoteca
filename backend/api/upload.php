<?php
declare(strict_types=1);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth.php';

if (request_method() !== 'POST') {
    json_error('Método no permitido.', 405);
}
require_admin();

$cfg = app_config()['uploads'];
$maxBytes = (int) ($cfg['max_bytes'] ?? 5 * 1024 * 1024);
$file = $_FILES['imagen'] ?? null;

if (!$file || !is_array($file) || is_array($file['error'])) {
    json_error('No se recibió ninguna imagen (campo "imagen").', 400);
}

switch ($file['error']) {
    case UPLOAD_ERR_OK:
        break;
    case UPLOAD_ERR_INI_SIZE:
    case UPLOAD_ERR_FORM_SIZE:
        json_error('La imagen supera el tamaño máximo permitido.', 413);
    default:
        json_error('Error al subir la imagen (código ' . (int) $file['error'] . ').', 400);
}

if ($file['size'] <= 0 || $file['size'] > $maxBytes) {
    json_error('La imagen supera los ' . round($maxBytes / 1048576) . ' MB.', 413);
}
if (!is_uploaded_file($file['tmp_name'])) {
    json_error('Archivo inválido.', 400);
}

// Validación por contenido real, no por la extensión ni el MIME que declara el navegador.
$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
if (!isset($allowed[$mime])) {
    json_error('Formato no permitido. Usá JPG, PNG o WEBP.', 415);
}
$info = @getimagesize($file['tmp_name']);
if ($info === false || $info[0] < 1 || $info[1] < 1 || $info[0] > 8000 || $info[1] > 8000) {
    json_error('El archivo no es una imagen válida.', 415);
}

$dir = rtrim($cfg['dir'], '/');
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    json_error('No se pudo crear la carpeta de imágenes.', 500);
}

$subdir = date('Y/m');
if (!is_dir("$dir/$subdir") && !mkdir("$dir/$subdir", 0755, true)) {
    json_error('No se pudo crear la carpeta de imágenes.', 500);
}

$name = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
$target = "$dir/$subdir/$name";
if (!move_uploaded_file($file['tmp_name'], $target)) {
    json_error('No se pudo guardar la imagen.', 500);
}
@chmod($target, 0644);

json_response([
    'url'    => rtrim($cfg['url'], '/') . "/$subdir/$name",
    'width'  => $info[0],
    'height' => $info[1],
], 201);
