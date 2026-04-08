<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    method_not_allowed(['GET']);
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->query('SELECT id, title, description, tag, sort_order FROM involvement ORDER BY sort_order ASC, id ASC');
    $data = $stmt->fetchAll();

    json_response([
        'success' => true,
        'data' => $data,
    ]);
} catch (Throwable $exception) {
    server_error($exception);
}
