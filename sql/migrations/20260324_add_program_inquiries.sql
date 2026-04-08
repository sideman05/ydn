CREATE TABLE IF NOT EXISTS program_inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  program_area VARCHAR(120) NOT NULL,
  role VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'reviewed', 'in_progress', 'resolved') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
