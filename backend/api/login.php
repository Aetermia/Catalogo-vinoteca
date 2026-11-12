<?php
declare(strict_types=1);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

if (request_method() !== 'POST') {
    json_error('Método no permitido.', 405);
}
require_ajax_header();

$body = read_json_body();
$usuario = str_field($body, 'usuario', 60);
$password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';

if ($usuario === '' || $password === '') {
    json_error('Completá usuario y contraseña.', 422);
}

$pdo = db();
$ip = substr($_SERVER['REMOTE_ADDR'] ?? 'desconocida', 0, 45);
$max = (int) (app_config()['login_max_attempts'] ?? 5);

// Limpieza de bloqueos vencidos (15 minutos) y control de intentos.
$pdo->prepare('DELETE FROM login_intentos WHERE ultimo < (NOW() - INTERVAL 15 MINUTE)')->execute();
$stmt = $pdo->prepare('SELECT intentos FROM login_intentos WHERE ip = ?');
$stmt->execute([$ip]);
if ((int) $stmt->fetchColumn() >= $max) {
    json_error('Demasiados intentos. Probá de nuevo en 15 minutos.', 429);
}

$stmt = $pdo->prepare('SELECT id, usuario, password_hash FROM admins WHERE usuario = ? LIMIT 1');
$stmt->execute([$usuario]);
$admin = $stmt->fetch();

// password_verify se ejecuta siempre para no filtrar por tiempo si el usuario existe.
$hash = $admin['password_hash'] ?? '$2y$10$bAlcIfjgnHbrj8mFgH3RZuTbeEnBhv2FA0y7POsJsyyEB0ICoIX.i';
$valid = password_verify($password, $hash) && $admin;

if (!$valid) {
    $pdo->prepare('INSERT INTO login_intentos (ip, intentos) VALUES (?, 1) ON DUPLICATE KEY UPDATE intentos = intentos + 1, ultimo = NOW()')
        ->execute([$ip]);
    json_error('Usuario o contraseña incorrectos.', 401);
}

$pdo->prepare('DELETE FROM login_intentos WHERE ip = ?')->execute([$ip]);

if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $admin['id']]);
}

start_session();
session_regenerate_id(true);
$_SESSION['admin_id'] = (int) $admin['id'];
$_SESSION['admin_usuario'] = $admin['usuario'];

json_response(['authenticated' => true, 'usuario' => $admin['usuario']]);
