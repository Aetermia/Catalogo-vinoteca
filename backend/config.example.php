<?php
// Copiar este archivo como config.php y completar con los datos del hosting.
// config.php está en .gitignore: nunca se versiona.
return [
    'db' => [
        'host'    => 'localhost',
        'port'    => 3306,
        'name'    => 'vinoteca',
        'user'    => 'vinoteca_user',
        'pass'    => 'cambiar-esta-clave',
        'charset' => 'utf8mb4',
    ],

    // Orígenes autorizados a llamar la API con cookies (solo hace falta si el frontend
    // se sirve desde otro dominio, p. ej. el servidor de desarrollo de Vite).
    'cors_origins' => [
        'http://localhost:5173',
    ],

    'session' => [
        'name'     => 'vinoteca_admin',
        'lifetime' => 60 * 60 * 8, // 8 horas
        'secure'   => true,        // false solo para desarrollo local sin HTTPS
    ],

    'uploads' => [
        'dir'       => __DIR__ . '/uploads',
        'url'       => '/backend/uploads', // URL pública de la carpeta anterior
        'max_bytes' => 5 * 1024 * 1024,
    ],

    // Intentos de login fallidos permitidos por IP antes de bloquear por 15 minutos.
    'login_max_attempts' => 5,
];
