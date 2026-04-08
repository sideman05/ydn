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

    $fullName = trim((string)($payload['full_name'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $programArea = trim((string)($payload['program_area'] ?? ''));
    $role = trim((string)($payload['role'] ?? ''));
    $message = trim((string)($payload['message'] ?? ''));

    $errors = [];

    if ($fullName === '') {
        $errors['full_name'] = 'Full name is required';
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'A valid email is required';
    }

    if ($programArea === '') {
        $errors['program_area'] = 'Program area is required';
    }

    if ($role === '') {
        $errors['role'] = 'Role is required';
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
        'INSERT INTO program_inquiries (full_name, email, program_area, role, message) VALUES (:full_name, :email, :program_area, :role, :message)'
    );

    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':program_area' => $programArea,
        ':role' => $role,
        ':message' => $message,
    ]);

    json_response([
        'success' => true,
        'message' => 'Inquiry received successfully',
        'data' => [
            'id' => (int)$pdo->lastInsertId(),
            'full_name' => $fullName,
            'email' => $email,
            'program_area' => $programArea,
            'role' => $role,
        ],
    ], 201);
} catch (Throwable $exception) {
    server_error($exception);
}
