<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!in_array($method, ['GET', 'POST'], true)) {
    method_not_allowed(['GET', 'POST']);
}

try {
    $pdo = get_db_connection();

    if ($method === 'GET') {
        $publicationId = (int)($_GET['publication_id'] ?? 0);

        if ($publicationId <= 0) {
            json_response([
                'success' => false,
                'message' => 'publication_id is required',
            ], 422);
        }

        $stmt = $pdo->prepare(
            'SELECT id, publication_id, name, comment, created_at
             FROM publication_comments
             WHERE publication_id = :publication_id
             ORDER BY id DESC'
        );

        $stmt->execute([':publication_id' => $publicationId]);

        json_response([
            'success' => true,
            'data' => $stmt->fetchAll(),
        ]);
    }

    $payload = get_json_input();
    if (!$payload && !empty($_POST)) {
        $payload = $_POST;
    }

    $publicationId = (int)($payload['publication_id'] ?? 0);
    $name = trim((string)($payload['name'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $comment = trim((string)($payload['comment'] ?? ''));

    $errors = [];

    if ($publicationId <= 0) {
        $errors['publication_id'] = 'publication_id is required';
    }

    if ($name === '') {
        $errors['name'] = 'Name is required';
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'A valid email is required';
    }

    if ($comment === '' || mb_strlen($comment) < 3) {
        $errors['comment'] = 'Comment must be at least 3 characters';
    }

    if (!empty($errors)) {
        json_response([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors,
        ], 422);
    }

    $pubCheck = $pdo->prepare('SELECT id FROM publications WHERE id = :id LIMIT 1');
    $pubCheck->execute([':id' => $publicationId]);

    if (!$pubCheck->fetch()) {
        json_response([
            'success' => false,
            'message' => 'Publication not found',
        ], 404);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO publication_comments (publication_id, name, email, comment)
         VALUES (:publication_id, :name, :email, :comment)'
    );

    $stmt->execute([
        ':publication_id' => $publicationId,
        ':name' => $name,
        ':email' => $email,
        ':comment' => $comment,
    ]);

    json_response([
        'success' => true,
        'message' => 'Comment posted successfully',
        'data' => [
            'id' => (int)$pdo->lastInsertId(),
            'publication_id' => $publicationId,
            'name' => $name,
            'comment' => $comment,
        ],
    ], 201);
} catch (Throwable $exception) {
    server_error($exception);
}
