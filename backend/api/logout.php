<?php
declare(strict_types=1);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth.php';

if (request_method() !== 'POST') {
    json_error('Método no permitido.', 405);
}
require_ajax_header();

start_session();
$_SESSION = [];
$params = session_get_cookie_params();
setcookie(session_name(), '', [
    'expires'  => time() - 3600,
    'path'     => $params['path'],
    'secure'   => $params['secure'],
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_destroy();

json_response(['authenticated' => false]);
