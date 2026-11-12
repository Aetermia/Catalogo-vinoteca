<?php
declare(strict_types=1);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth.php';

$admin = current_admin();
json_response($admin
    ? ['authenticated' => true, 'usuario' => $admin['usuario']]
    : ['authenticated' => false]);
