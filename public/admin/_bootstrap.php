<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

    $scriptDir = str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/admin')));
    $cookiePath = rtrim($scriptDir, '/');
    if ($cookiePath === '') {
        $cookiePath = '/';
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $cookiePath,
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);

    session_name('ydnea_admin_session');
    session_start();
}

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none';");

require_once __DIR__ . '/../../api/config/database.php';
require_once __DIR__ . '/../../api/config/helpers.php';

const ADMIN_SESSION_KEY = 'ydnea_admin_auth';
const ADMIN_CSRF_KEY = 'ydnea_admin_csrf';

function admin_load_env_file(): array
{
    static $cache = null;

    if (is_array($cache)) {
        return $cache;
    }

    $cache = [];
    $envPath = __DIR__ . '/.env';

    if (!is_file($envPath) || !is_readable($envPath)) {
        return $cache;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) {
        return $cache;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $parts = explode('=', $trimmed, 2);
        if (count($parts) !== 2) {
            continue;
        }

        $key = trim($parts[0]);
        $value = trim($parts[1]);

        if ($key === '') {
            continue;
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        $cache[$key] = $value;
    }

    return $cache;
}

function admin_env(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value !== false) {
        return (string)$value;
    }

    $envFile = admin_load_env_file();
    if (array_key_exists($key, $envFile)) {
        return (string)$envFile[$key];
    }

    return $default;
}

function admin_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function admin_is_authenticated(): bool
{
    return isset($_SESSION[ADMIN_SESSION_KEY]['ok']) && $_SESSION[ADMIN_SESSION_KEY]['ok'] === true;
}

function admin_require_auth(): void
{
    if (!admin_is_authenticated()) {
        admin_json([
            'success' => false,
            'message' => 'Unauthorized',
        ], 401);
    }
}

function admin_csrf_token(): string
{
    if (!isset($_SESSION[ADMIN_CSRF_KEY]) || !is_string($_SESSION[ADMIN_CSRF_KEY])) {
        $_SESSION[ADMIN_CSRF_KEY] = bin2hex(random_bytes(32));
    }

    return $_SESSION[ADMIN_CSRF_KEY];
}

function admin_require_csrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || $token === '' || !hash_equals(admin_csrf_token(), $token)) {
        admin_json([
            'success' => false,
            'message' => 'Invalid CSRF token',
        ], 419);
    }
}

function admin_get_json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function admin_login_attempts_exceeded(): bool
{
    $attempts = (int)($_SESSION['admin_login_attempts'] ?? 0);
    $last = (int)($_SESSION['admin_login_last_attempt'] ?? 0);

    if ($attempts < 5) {
        return false;
    }

    return (time() - $last) < 900;
}

function admin_register_failed_attempt(): void
{
    $_SESSION['admin_login_attempts'] = (int)($_SESSION['admin_login_attempts'] ?? 0) + 1;
    $_SESSION['admin_login_last_attempt'] = time();
}

function admin_clear_failed_attempts(): void
{
    unset($_SESSION['admin_login_attempts'], $_SESSION['admin_login_last_attempt']);
}

function admin_verify_credentials(string $username, string $password): bool
{
    $expectedUsername = admin_env('ADMIN_USERNAME', 'admin');
    $passwordHash = admin_env('ADMIN_PASSWORD_HASH', '');
    $plainPassword = admin_env('ADMIN_PASSWORD', '');

    if ($username !== $expectedUsername) {
        return false;
    }

    if ($passwordHash !== '') {
        return password_verify($password, $passwordHash);
    }

    if ($plainPassword === '') {
        return false;
    }

    return hash_equals($plainPassword, $password);
}
