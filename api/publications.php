<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!in_array($method, ['GET', 'POST'], true)) {
    method_not_allowed(['GET', 'POST']);
}

try {
    $pdo = get_db_connection();
    publications_ensure_image_column($pdo);
    publications_prepare_slug_support($pdo);

    if ($method === 'GET') {
        $id = (int)($_GET['id'] ?? 0);
        $slug = trim((string)($_GET['slug'] ?? ''));

        if ($slug !== '' || $id > 0) {
            $query = 'SELECT id, slug, title, description, tag, sort_order, image_path, created_at FROM publications';

            if ($slug !== '') {
                $query .= ' WHERE slug = :slug LIMIT 1';
                $stmt = $pdo->prepare($query);
                $stmt->execute([':slug' => $slug]);
            } else {
                $query .= ' WHERE id = :id LIMIT 1';
                $stmt = $pdo->prepare($query);
                $stmt->execute([':id' => $id]);
            }

            $item = $stmt->fetch();

            if (!$item) {
                json_response([
                    'success' => false,
                    'message' => 'Publication not found',
                ], 404);
            }

            json_response([
                'success' => true,
                'data' => $item,
            ]);
        }

        $query = 'SELECT id, slug, title, description, tag, sort_order, image_path, created_at FROM publications ORDER BY sort_order ASC, id DESC';
        $stmt = $pdo->query($query);
        $data = $stmt->fetchAll();

        json_response([
            'success' => true,
            'data' => $data,
        ]);
    }

    $title = trim((string)($_POST['title'] ?? ''));
    $description = trim((string)($_POST['description'] ?? ''));
    $tag = trim((string)($_POST['tag'] ?? 'Publication'));
    $sortOrder = (int)($_POST['sort_order'] ?? 0);

    $errors = [];

    if ($title === '') {
        $errors['title'] = 'Title is required';
    }

    if ($description === '' || mb_strlen($description) < 10) {
        $errors['description'] = 'Description must be at least 10 characters';
    }

    if ($tag === '') {
        $errors['tag'] = 'Category is required';
    }

    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        $errors['image'] = 'Cover image is required';
    }

    $imagePath = null;

    if (empty($errors)) {
        $image = $_FILES['image'];
        $uploadError = (int)($image['error'] ?? UPLOAD_ERR_NO_FILE);

        if ($uploadError !== UPLOAD_ERR_OK) {
            $errors['image'] = 'Image upload failed';
        } else {
            $tmpName = (string)($image['tmp_name'] ?? '');
            $originalName = (string)($image['name'] ?? '');
            $fileSize = (int)($image['size'] ?? 0);

            if ($tmpName === '' || !is_uploaded_file($tmpName)) {
                $errors['image'] = 'Invalid uploaded image';
            } elseif ($fileSize > 5 * 1024 * 1024) {
                $errors['image'] = 'Image size must be 5MB or less';
            } else {
                $finfo = new finfo(FILEINFO_MIME_TYPE);
                $mime = (string)$finfo->file($tmpName);
                $allowedMime = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                    'image/gif' => 'gif',
                ];

                if (!isset($allowedMime[$mime])) {
                    $errors['image'] = 'Unsupported image type';
                } else {
                    $extension = $allowedMime[$mime];
                    $safeBase = slugify((string)pathinfo($originalName, PATHINFO_FILENAME));
                    if ($safeBase === '') {
                        $safeBase = 'publication';
                    }

                    $fileName = sprintf('%s-%s.%s', $safeBase, bin2hex(random_bytes(6)), $extension);
                    $uploadDir = __DIR__ . '/../public/uploads/publications';

                    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
                        $errors['image'] = 'Upload directory is not available';
                    }

                    if (!isset($errors['image'])) {
                        $destination = $uploadDir . '/' . $fileName;

                        if (!move_uploaded_file($tmpName, $destination)) {
                            $errors['image'] = 'Server cannot save uploaded image. Check folder permissions.';
                        }
                    }

                    if (!isset($errors['image'])) {
                        $imagePath = 'uploads/publications/' . $fileName;
                    }
                }
            }
        }
    }

    if (!empty($errors)) {
        json_response([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors,
        ], 422);
    }

    $slug = publications_generate_unique_slug($pdo, $title);

    $stmt = $pdo->prepare(
        'INSERT INTO publications (title, slug, description, tag, sort_order, image_path) VALUES (:title, :slug, :description, :tag, :sort_order, :image_path)'
    );

    $stmt->execute([
        ':title' => $title,
        ':slug' => $slug,
        ':description' => $description,
        ':tag' => $tag,
        ':sort_order' => $sortOrder,
        ':image_path' => $imagePath,
    ]);

    json_response([
        'success' => true,
        'message' => 'Publication uploaded successfully',
        'data' => [
            'id' => (int)$pdo->lastInsertId(),
            'slug' => $slug,
            'title' => $title,
            'description' => $description,
            'tag' => $tag,
            'sort_order' => $sortOrder,
            'image_path' => $imagePath,
        ],
    ], 201);
} catch (Throwable $exception) {
    server_error($exception);
}
