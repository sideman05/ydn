CREATE TABLE IF NOT EXISTS involvement_inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(80) NULL,
  involvement_area VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'reviewed', 'in_progress', 'resolved') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
