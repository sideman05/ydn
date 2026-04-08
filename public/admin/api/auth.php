<?php
declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string)($_GET['action'] ?? 'status');

if ($method === 'GET' && $action === 'status') {
    admin_json([
        'success' => true,
        'authenticated' => admin_is_authenticated(),
        'csrf_token' => admin_csrf_token(),
        'has_password' => admin_env('ADMIN_PASSWORD_HASH', '') !== '' || admin_env('ADMIN_PASSWORD', '') !== '',
    ]);
}

if ($method === 'POST' && $action === 'login') {
    if (admin_login_attempts_exceeded()) {
        admin_json([
            'success' => false,
            'message' => 'Too many failed login attempts. Try again later.',
        ], 429);
    }

    $payload = admin_get_json_input();
    $username = trim((string)($payload['username'] ?? ''));
    $password = (string)($payload['password'] ?? '');

    if ($username === '' || $password === '') {
        admin_json([
            'success' => false,
            'message' => 'Username and password are required.',
        ], 422);
    }

    if (!admin_verify_credentials($username, $password)) {
        admin_register_failed_attempt();

        admin_json([
            'success' => false,
            'message' => 'Invalid credentials.',
        ], 401);
    }

    session_regenerate_id(true);
    $_SESSION[ADMIN_SESSION_KEY] = [
        'ok' => true,
        'username' => $username,
        'logged_in_at' => time(),
    ];

    admin_clear_failed_attempts();

    admin_json([
        'success' => true,
        'message' => 'Login successful.',
        'csrf_token' => admin_csrf_token(),
        'username' => $username,
    ]);
}

if ($method === 'POST' && $action === 'logout') {
    admin_require_auth();
    admin_require_csrf();

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'] ?? '/',
            $params['domain'] ?? '',
            (bool)($params['secure'] ?? false),
            (bool)($params['httponly'] ?? true)
        );
    }

    session_destroy();

    admin_json([
        'success' => true,
        'message' => 'Logged out successfully.',
    ]);
}

admin_json([
    'success' => false,
    'message' => 'Not found',
], 404);
