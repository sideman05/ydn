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

    $fullName = trim((string)($payload['full_name'] ?? $payload['name'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $phone = trim((string)($payload['phone'] ?? ''));
    $track = trim((string)($payload['track'] ?? ''));
    $location = trim((string)($payload['location'] ?? ''));
    $availability = trim((string)($payload['availability'] ?? ''));
    $motivation = trim((string)($payload['motivation'] ?? ''));

    $errors = [];

    if ($fullName === '') {
        $errors['full_name'] = 'Full name is required';
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'A valid email is required';
    }

    if ($phone === '' || mb_strlen($phone) < 7) {
        $errors['phone'] = 'Phone number is required';
    }

    if ($track === '') {
        $errors['track'] = 'Preferred track is required';
    }

    if ($location === '') {
        $errors['location'] = 'Location is required';
    }

    if ($availability === '') {
        $errors['availability'] = 'Availability is required';
    }

    if ($motivation === '' || mb_strlen($motivation) < 30) {
        $errors['motivation'] = 'Motivation must be at least 30 characters';
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
        'INSERT INTO fellowship_applications (full_name, email, phone, track, location, availability, motivation) VALUES (:full_name, :email, :phone, :track, :location, :availability, :motivation)'
    );

    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':phone' => $phone,
        ':track' => $track,
        ':location' => $location,
        ':availability' => $availability,
        ':motivation' => $motivation,
    ]);

    json_response([
        'success' => true,
        'message' => 'Application submitted successfully',
        'data' => [
            'id' => (int)$pdo->lastInsertId(),
            'full_name' => $fullName,
            'email' => $email,
            'track' => $track,
            'status' => 'pending',
        ],
    ], 201);
} catch (Throwable $exception) {
    server_error($exception);
}
