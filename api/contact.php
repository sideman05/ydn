<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    method_not_allowed(['GET']);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->query('SELECT email, phone, location, hours FROM contact_details ORDER BY id ASC LIMIT 1');
    $contact = $stmt->fetch();

    if (!$contact) {
        json_response([
            'success' => true,
            'data' => [
                'email' => 'ydn.eastafrica@gmail.com',
                'phone' => '',
                'location' => 'Kibaha, Pwani, Tanzania',
                'hours' => 'Dar es Salaam, Tanzania',
            ],
        ]);
    }

    json_response([
        'success' => true,
        'data' => $contact,
    ]);
} catch (Throwable $exception) {
    server_error($exception);
}
