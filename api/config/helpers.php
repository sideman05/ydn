<?php
declare(strict_types=1);

function slugify(string $text): string
{
    $text = trim($text);

    if ($text === '') {
        return '';
    }

    if (class_exists(Transliterator::class)) {
        $transliterator = Transliterator::create('Any-Latin; Latin-ASCII');
        if ($transliterator instanceof Transliterator) {
            $text = $transliterator->transliterate($text);
        }
    } elseif (function_exists('iconv')) {
        $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        if (is_string($transliterated)) {
            $text = $transliterated;
        }
    }

    $text = strtolower($text);
    $text = preg_replace('/[\'’`]+/', '', $text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);

    return trim((string)$text, '-');
}

function publications_has_column(PDO $pdo, string $column): bool
{
    $stmt = $pdo->prepare('SHOW COLUMNS FROM publications LIKE :column');
    $stmt->execute([':column' => $column]);
    return (bool)$stmt->fetch();
}

function publications_ensure_image_column(PDO $pdo): void
{
    if (publications_has_column($pdo, 'image_path')) {
        return;
    }

    try {
        $pdo->exec("ALTER TABLE publications ADD COLUMN image_path VARCHAR(255) NULL AFTER tag");
    } catch (Throwable $exception) {
        if (!publications_has_column($pdo, 'image_path')) {
            throw $exception;
        }
    }
}

function publications_has_slug_unique_index(PDO $pdo): bool
{
    $stmt = $pdo->query("SHOW INDEX FROM publications WHERE Column_name = 'slug'");
    $indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($indexes as $index) {
        if ((int)($index['Non_unique'] ?? 1) === 0) {
            return true;
        }
    }

    return false;
}

function publications_slug_exists(PDO $pdo, string $slug, ?int $excludeId = null): bool
{
    $sql = 'SELECT id FROM publications WHERE slug = :slug';
    $params = [':slug' => $slug];

    if ($excludeId !== null && $excludeId > 0) {
        $sql .= ' AND id <> :exclude_id';
        $params[':exclude_id'] = $excludeId;
    }

    $sql .= ' LIMIT 1';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return (bool)$stmt->fetch();
}

function publications_generate_unique_slug(PDO $pdo, string $title, ?int $excludeId = null): string
{
    $base = slugify($title);
    if ($base === '') {
        $base = 'publication';
    }

    $candidate = $base;
    $suffix = 2;

    while (publications_slug_exists($pdo, $candidate, $excludeId)) {
        $candidate = sprintf('%s-%d', $base, $suffix);
        $suffix++;
    }

    return $candidate;
}

function publications_assign_slug_if_missing(PDO $pdo, int $id, string $title): string
{
    $stmt = $pdo->prepare('SELECT slug FROM publications WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $slug = trim((string)($stmt->fetchColumn() ?: ''));

    if ($slug !== '') {
        return $slug;
    }

    $slug = publications_generate_unique_slug($pdo, $title, $id);

    $update = $pdo->prepare('UPDATE publications SET slug = :slug WHERE id = :id');
    $update->execute([
        ':slug' => $slug,
        ':id' => $id,
    ]);

    return $slug;
}

function publications_ensure_slug_column(PDO $pdo): void
{
    if (publications_has_column($pdo, 'slug')) {
        return;
    }

    try {
        $pdo->exec("ALTER TABLE publications ADD COLUMN slug VARCHAR(191) NULL AFTER title");
    } catch (Throwable $exception) {
        if (!publications_has_column($pdo, 'slug')) {
            throw $exception;
        }
    }
}

function publications_backfill_missing_slugs(PDO $pdo): void
{
    $stmt = $pdo->query("SELECT id, title FROM publications WHERE slug IS NULL OR slug = '' ORDER BY id ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($rows === []) {
        return;
    }

    $update = $pdo->prepare('UPDATE publications SET slug = :slug WHERE id = :id');

    foreach ($rows as $row) {
        $id = (int)($row['id'] ?? 0);
        if ($id <= 0) {
            continue;
        }

        $slug = publications_generate_unique_slug($pdo, (string)($row['title'] ?? ''), $id);
        $update->execute([
            ':slug' => $slug,
            ':id' => $id,
        ]);
    }
}

function publications_ensure_slug_index(PDO $pdo): void
{
    if (publications_has_slug_unique_index($pdo)) {
        return;
    }

    try {
        $pdo->exec('ALTER TABLE publications ADD UNIQUE KEY uniq_publications_slug (slug)');
    } catch (Throwable $exception) {
        if (!publications_has_slug_unique_index($pdo)) {
            throw $exception;
        }
    }
}

function publications_prepare_slug_support(PDO $pdo): void
{
    publications_ensure_slug_column($pdo);
    publications_backfill_missing_slugs($pdo);
    publications_ensure_slug_index($pdo);
}
