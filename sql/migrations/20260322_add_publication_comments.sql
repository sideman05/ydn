CREATE TABLE IF NOT EXISTS publication_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  publication_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_publication_comments_publication
    FOREIGN KEY (publication_id) REFERENCES publications(id)
    ON DELETE CASCADE
);
