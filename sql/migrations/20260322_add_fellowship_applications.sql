CREATE TABLE IF NOT EXISTS fellowship_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(80) NOT NULL,
  track VARCHAR(120) NOT NULL,
  location VARCHAR(180) NOT NULL,
  availability VARCHAR(120) NOT NULL,
  motivation TEXT NOT NULL,
  status ENUM('pending', 'reviewed', 'shortlisted', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
