<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $c = app_config()['session'] ?? [];
    session_name($c['name'] ?? 'vinoteca_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => (bool) ($c['secure'] ?? true),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    // Expiración por inactividad.
    $lifetime = (int) ($c['lifetime'] ?? 28800);
    if (isset($_SESSION['last_seen']) && time() - $_SESSION['last_seen'] > $lifetime) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['last_seen'] = time();
}

function current_admin(): ?array
{
    start_session();
    if (empty($_SESSION['admin_id'])) {
        return null;
    }
    return ['id' => (int) $_SESSION['admin_id'], 'usuario' => (string) $_SESSION['admin_usuario']];
}

function require_admin(): array
{
    $admin = current_admin();
    if ($admin === null) {
        json_error('Sesión expirada o no iniciada.', 401);
    }
    require_ajax_header();
    return $admin;
}
