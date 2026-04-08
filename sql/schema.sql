CREATE DATABASE IF NOT EXISTS ydnea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ydnea;

CREATE TABLE IF NOT EXISTS hero_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  value VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tag VARCHAR(60) NOT NULL DEFAULT 'Program',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS involvement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tag VARCHAR(60) NOT NULL DEFAULT 'Get Involved',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tag VARCHAR(60) NOT NULL DEFAULT 'Resource',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  tag VARCHAR(60) NOT NULL DEFAULT 'Publication',
  image_path VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fellowships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tag VARCHAR(60) NOT NULL DEFAULT 'Fellowship',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(80) NOT NULL,
  location VARCHAR(255) NOT NULL,
  hours VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(80) NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

TRUNCATE TABLE hero_stats;
TRUNCATE TABLE programs;
TRUNCATE TABLE involvement;
TRUNCATE TABLE resources;
TRUNCATE TABLE publications;
TRUNCATE TABLE fellowships;
TRUNCATE TABLE contact_details;

INSERT INTO hero_stats (label, value, sort_order) VALUES
('Founded', 'Dec 2025', 1),
('EAC Countries', '6', 2),
('Program Areas', '5', 3),
('Core Values', '5', 4);

INSERT INTO programs (title, description, tag, sort_order) VALUES
('Leadership & Civic Engagement', 'Equipping youth with leadership skills to actively participate in governance, decision-making, and community development initiatives.', 'Leadership', 1),
('Entrepreneurship & Economic Empowerment', 'Providing training, mentorship, and resources to help young people start businesses, secure employment, and achieve financial independence.', 'Entrepreneurship', 2),
('Education & Skills Development', 'Enhancing access to practical education, vocational training, and digital skills for success in a modern economy.', 'Education', 3),
('Youth Advocacy & Policy Influence', 'Promoting youth-inclusive policies and engaging in regional and national dialogues to ensure youth voices are heard.', 'Advocacy', 4),
('Community Resilience & Social Change', 'Supporting initiatives that strengthen communities through social cohesion, mental health awareness, environmental sustainability, and innovation.', 'Resilience', 5);

INSERT INTO involvement (title, description, tag, sort_order) VALUES
('Young Leaders', 'We welcome youth leaders who are ready to shape their future and contribute to sustainable development.', 'Join Us', 1),
('Partners', 'We collaborate with civil society organizations, development partners, and private-sector stakeholders.', 'Join Us', 2),
('Volunteers', 'Contribute your time and skills to support youth-focused programs across East Africa.', 'Join Us', 3),
('Supporters', 'Your support helps empower the next generation to Dare to Dream and Dare to Achieve.', 'Join Us', 4);

INSERT INTO resources (title, description, tag, sort_order) VALUES
('Blog / Articles', 'Thought leadership and practical perspectives on youth development trends.', 'Resource', 1),
('News', 'Organization updates, policy moments, and announcements from the field.', 'Resource', 2),
('Success Stories', 'Real stories of youth transformation and measurable impact in communities.', 'Resource', 3);

INSERT INTO publications (title, slug, description, tag, sort_order) VALUES
('Annual Reports', 'annual-reports', 'Transparent reporting on outcomes, finances, and strategic milestones.', 'Publication', 1),
('Policy Briefs', 'policy-briefs', 'Actionable recommendations for policymakers and development partners.', 'Publication', 2),
('Research', 'research', 'Data-informed studies highlighting youth priorities and intervention results.', 'Publication', 3),
('Data Privacy Policy', 'data-privacy-policy', 'How we collect, protect, and process personal data responsibly.', 'Publication', 4);

INSERT INTO fellowships (title, description, tag, sort_order) VALUES
('Youth Leadership Fellowship', 'An intensive leadership journey for young changemakers driving community action.', 'Fellowship', 1),
('Mentorship Program', 'Structured coaching and guidance from experienced professionals and alumni.', 'Fellowship', 2),
('Training & Workshops', 'Hands-on workshops in communication, employability, innovation, and advocacy.', 'Fellowship', 3);

INSERT INTO contact_details (email, phone, location, hours) VALUES
('ydn.eastafrica@gmail.com', '', 'Kibaha, Pwani, Tanzania', 'Dar es Salaam, Tanzania');
