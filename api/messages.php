<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'POST') {
    method_not_allowed(['POST']);
}

try {
    $payload = get_json_input();

    if (!$payload && !empty($_POST)) {
        $payload = $_POST;
    }

    $name = trim((string)($payload['name'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $phone = trim((string)($payload['phone'] ?? ''));
    $subject = trim((string)($payload['subject'] ?? ''));
    $message = trim((string)($payload['message'] ?? ''));

    $errors = [];

    if ($name === '') {
        $errors['name'] = 'Name is required';
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'A valid email is required';
    }

    if ($subject === '') {
        $errors['subject'] = 'Subject is required';
    }

    if ($message === '' || mb_strlen($message) < 10) {
        $errors['message'] = 'Message must be at least 10 characters';
    }

    if (!empty($errors)) {
        json_response([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors,
        ], 422);
    }

    $pdo = get_db_connection();

    $stmt = $pdo->prepare(
        'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (:name, :email, :phone, :subject, :message)'
    );

    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone !== '' ? $phone : null,
        ':subject' => $subject,
        ':message' => $message,
    ]);

    json_response([
        'success' => true,
        'message' => 'Message received successfully',
        'data' => [
            'id' => (int)$pdo->lastInsertId(),
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'subject' => $subject,
        ],
    ], 201);
} catch (Throwable $exception) {
    server_error($exception);
}
