<?php
// Uso (solo CLI): php backend/create_admin.php USUARIO "CONTRASEÑA"
// Crea el usuario o actualiza su contraseña si ya existe.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/db.php';

[$script, $usuario, $password] = array_pad($argv, 3, null);
if (!$usuario || !$password || strlen($password) < 8) {
    fwrite(STDERR, "Uso: php create_admin.php USUARIO CONTRASEÑA (mínimo 8 caracteres)\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = db()->prepare('INSERT INTO admins (usuario, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)');
$stmt->execute([$usuario, $hash]);
echo "Administrador \"$usuario\" guardado.\n";
