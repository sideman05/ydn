<?php
declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';

admin_require_auth();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    admin_json([
        'success' => false,
        'message' => 'Method not allowed',
    ], 405);
}

admin_require_csrf();

try {
    $pdo = get_db_connection();

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
                    $uploadDir = __DIR__ . '/../../uploads/publications';

                    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
                        $errors['image'] = 'Upload directory is not available';
                    }

                    if (!isset($errors['image'])) {
                        $destination = $uploadDir . '/' . $fileName;
                        if (!move_uploaded_file($tmpName, $destination)) {
                            $errors['image'] = 'Server cannot save uploaded image.';
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
        admin_json([
            'success' => false,
            'message' => 'Validation failed.',
            'errors' => $errors,
        ], 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO publications (title, description, tag, sort_order, image_path) VALUES (:title, :description, :tag, :sort_order, :image_path)'
    );

    $stmt->execute([
        ':title' => $title,
        ':description' => $description,
        ':tag' => $tag,
        ':sort_order' => $sortOrder,
        ':image_path' => $imagePath,
    ]);

    admin_json([
        'success' => true,
        'message' => 'Publication uploaded successfully.',
        'data' => [
            'id' => (int)$pdo->lastInsertId(),
            'title' => $title,
            'tag' => $tag,
            'image_path' => $imagePath,
        ],
    ], 201);
} catch (Throwable $exception) {
    admin_json([
        'success' => false,
        'message' => 'Server error',
        'error' => $exception->getMessage(),
    ], 500);
}
