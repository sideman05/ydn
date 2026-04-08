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
