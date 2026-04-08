<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    method_not_allowed(['GET']);
}

try {
    $pdo = get_db_connection();
    $pdo->query('SELECT 1');

    json_response([
        'success' => true,
        'message' => 'API is healthy',
        'timestamp' => date(DATE_ATOM),
    ]);
} catch (Throwable $exception) {
    server_error($exception);
}
