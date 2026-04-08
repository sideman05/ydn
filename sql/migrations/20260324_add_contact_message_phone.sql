SET @has_phone := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'contact_messages'
    AND COLUMN_NAME = 'phone'
);

SET @sql := IF(
  @has_phone = 0,
  'ALTER TABLE contact_messages ADD COLUMN phone VARCHAR(80) NULL AFTER email',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
