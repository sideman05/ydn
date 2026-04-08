<?php
declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';

admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string)($_GET['action'] ?? 'entities');

$entityMap = [
    'hero_stats' => [
        'table' => 'hero_stats',
        'pk' => 'id',
        'columns' => ['label', 'value', 'sort_order'],
        'readonly' => ['created_at'],
        'default_order' => 'sort_order ASC, id ASC',
    ],
    'programs' => [
        'table' => 'programs',
        'pk' => 'id',
        'columns' => ['title', 'description', 'tag', 'sort_order'],
        'readonly' => ['created_at'],
        'default_order' => 'sort_order ASC, id ASC',
    ],
    'involvement' => [
        'table' => 'involvement',
        'pk' => 'id',
        'columns' => ['title', 'description', 'tag', 'sort_order'],
        'readonly' => ['created_at'],
        'default_order' => 'sort_order ASC, id ASC',
    ],
    'resources' => [
        'table' => 'resources',
        'pk' => 'id',
        'columns' => ['title', 'description', 'tag', 'sort_order'],
        'readonly' => ['created_at'],
        'default_order' => 'sort_order ASC, id ASC',
    ],
    'publications' => [
        'table' => 'publications',
        'pk' => 'id',
        'columns' => ['title', 'description', 'tag', 'image_path', 'sort_order'],
        'readonly' => ['created_at'],
        'default_order' => 'sort_order ASC, id DESC',
    ],
    'fellowships' => [
        'table' => 'fellowships',
        'pk' => 'id',
        'columns' => ['title', 'description', 'tag', 'sort_order'],
        'readonly' => ['created_at'],
        'default_order' => 'sort_order ASC, id ASC',
    ],
    'contact_details' => [
        'table' => 'contact_details',
        'pk' => 'id',
        'columns' => ['email', 'phone', 'location', 'hours'],
        'readonly' => ['created_at'],
        'default_order' => 'id ASC',
    ],
    'contact_messages' => [
        'table' => 'contact_messages',
        'pk' => 'id',
        'columns' => ['name', 'email', 'phone', 'subject', 'message'],
        'readonly' => ['created_at'],
        'default_order' => 'id DESC',
        'read_only_table' => true,
    ],
    'program_inquiries' => [
        'table' => 'program_inquiries',
        'pk' => 'id',
        'columns' => ['full_name', 'email', 'program_area', 'role', 'message', 'status'],
        'readonly' => ['created_at'],
        'default_order' => 'id DESC',
        'status_values' => ['new', 'reviewed', 'in_progress', 'resolved'],
    ],
    'involvement_inquiries' => [
        'table' => 'involvement_inquiries',
        'pk' => 'id',
        'columns' => ['full_name', 'email', 'phone', 'involvement_area', 'message', 'status'],
        'readonly' => ['created_at'],
        'default_order' => 'id DESC',
        'status_values' => ['new', 'reviewed', 'in_progress', 'resolved'],
    ],
    'fellowship_applications' => [
        'table' => 'fellowship_applications',
        'pk' => 'id',
        'columns' => ['full_name', 'email', 'phone', 'track', 'location', 'availability', 'motivation', 'status'],
        'readonly' => ['created_at'],
        'default_order' => 'id DESC',
        'status_values' => ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'],
    ],
    'publication_comments' => [
        'table' => 'publication_comments',
        'pk' => 'id',
        'columns' => ['publication_id', 'name', 'email', 'comment'],
        'readonly' => ['created_at'],
        'default_order' => 'id DESC',
    ],
];

function data_get_entity(array $entityMap, string $entity): array
{
    if (!isset($entityMap[$entity])) {
        admin_json([
            'success' => false,
            'message' => 'Unknown entity',
        ], 422);
    }

    return $entityMap[$entity];
}

function data_normalize_value(string $column, mixed $value): mixed
{
    if ($value === null) {
        return null;
    }

    if (in_array($column, ['sort_order', 'publication_id'], true)) {
        return (int)$value;
    }

    return is_string($value) ? trim($value) : $value;
}

function data_validate_row(string $entityName, array $entity, array $row): array
{
    $errors = [];

    foreach ($row as $column => $value) {
        if (!in_array($column, $entity['columns'], true)) {
            continue;
        }

        if (in_array($column, ['title', 'label', 'value', 'name', 'full_name', 'subject'], true) && trim((string)$value) === '') {
            $errors[$column] = 'This field is required.';
        }

        if (in_array($column, ['description', 'message', 'comment', 'motivation'], true) && trim((string)$value) === '') {
            $errors[$column] = 'This field is required.';
        }

        if ($column === 'email' && trim((string)$value) !== '' && !filter_var((string)$value, FILTER_VALIDATE_EMAIL)) {
            $errors[$column] = 'Invalid email format.';
        }

        if ($column === 'status' && isset($entity['status_values']) && !in_array((string)$value, $entity['status_values'], true)) {
            $errors[$column] = 'Invalid status value.';
        }

        if ($column === 'sort_order' && !is_numeric($value)) {
            $errors[$column] = 'Sort order must be numeric.';
        }
    }

    if ($entityName === 'publication_comments' && (int)($row['publication_id'] ?? 0) <= 0) {
        $errors['publication_id'] = 'Publication id is required.';
    }

    return $errors;
}

try {
    $pdo = get_db_connection();

    if ($method === 'GET' && $action === 'entities') {
        $entities = [];

        foreach ($entityMap as $key => $meta) {
            $entities[] = [
                'key' => $key,
                'table' => $meta['table'],
                'pk' => $meta['pk'],
                'columns' => $meta['columns'],
                'readonly' => $meta['readonly'],
                'read_only_table' => (bool)($meta['read_only_table'] ?? false),
                'status_values' => $meta['status_values'] ?? null,
            ];
        }

        admin_json([
            'success' => true,
            'data' => $entities,
            'csrf_token' => admin_csrf_token(),
        ]);
    }

    if ($method === 'GET' && $action === 'list') {
        $entityName = (string)($_GET['entity'] ?? '');
        $entity = data_get_entity($entityMap, $entityName);

        $columns = array_merge([$entity['pk']], $entity['columns'], $entity['readonly']);
        $selectColumns = implode(', ', array_map(static fn(string $col): string => "`{$col}`", $columns));

        $sql = sprintf(
            'SELECT %s FROM `%s` ORDER BY %s LIMIT 200',
            $selectColumns,
            $entity['table'],
            $entity['default_order']
        );

        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        admin_json([
            'success' => true,
            'data' => $rows,
            'entity' => $entityName,
        ]);
    }

    if ($method === 'POST' && $action === 'save') {
        admin_require_csrf();

        $payload = admin_get_json_input();
        $entityName = (string)($payload['entity'] ?? '');
        $id = (int)($payload['id'] ?? 0);
        $inputValues = is_array($payload['values'] ?? null) ? $payload['values'] : [];

        $entity = data_get_entity($entityMap, $entityName);

        if (($entity['read_only_table'] ?? false) === true) {
            admin_json([
                'success' => false,
                'message' => 'This table is read-only in admin panel.',
            ], 403);
        }

        $values = [];
        foreach ($entity['columns'] as $column) {
            if (array_key_exists($column, $inputValues)) {
                $values[$column] = data_normalize_value($column, $inputValues[$column]);
            }
        }

        $errors = data_validate_row($entityName, $entity, $values);
        if (!empty($errors)) {
            admin_json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $errors,
            ], 422);
        }

        if ($id > 0) {
            if (empty($values)) {
                admin_json([
                    'success' => false,
                    'message' => 'No values provided for update.',
                ], 422);
            }

            $setParts = [];
            $params = [':id' => $id];
            foreach ($values as $column => $value) {
                $setParts[] = "`{$column}` = :{$column}";
                $params[":{$column}"] = $value;
            }

            $sql = sprintf(
                'UPDATE `%s` SET %s WHERE `%s` = :id',
                $entity['table'],
                implode(', ', $setParts),
                $entity['pk']
            );

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            admin_json([
                'success' => true,
                'message' => 'Record updated successfully.',
            ]);
        }

        if (empty($values)) {
            admin_json([
                'success' => false,
                'message' => 'No values provided for create.',
            ], 422);
        }

        $columns = array_keys($values);
        $columnList = implode(', ', array_map(static fn(string $col): string => "`{$col}`", $columns));
        $placeholders = implode(', ', array_map(static fn(string $col): string => ":{$col}", $columns));

        $sql = sprintf(
            'INSERT INTO `%s` (%s) VALUES (%s)',
            $entity['table'],
            $columnList,
            $placeholders
        );

        $params = [];
        foreach ($values as $column => $value) {
            $params[":{$column}"] = $value;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        admin_json([
            'success' => true,
            'message' => 'Record created successfully.',
            'id' => (int)$pdo->lastInsertId(),
        ], 201);
    }

    if ($method === 'POST' && $action === 'delete') {
        admin_require_csrf();

        $payload = admin_get_json_input();
        $entityName = (string)($payload['entity'] ?? '');
        $id = (int)($payload['id'] ?? 0);

        if ($id <= 0) {
            admin_json([
                'success' => false,
                'message' => 'Invalid id.',
            ], 422);
        }

        $entity = data_get_entity($entityMap, $entityName);

        $sql = sprintf(
            'DELETE FROM `%s` WHERE `%s` = :id',
            $entity['table'],
            $entity['pk']
        );

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);

        admin_json([
            'success' => true,
            'message' => 'Record deleted successfully.',
        ]);
    }

    admin_json([
        'success' => false,
        'message' => 'Not found',
    ], 404);
} catch (Throwable $exception) {
    admin_json([
        'success' => false,
        'message' => 'Server error',
        'error' => $exception->getMessage(),
    ], 500);
}
