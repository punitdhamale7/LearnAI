-- Setup Interest Selection Feature
-- Run this SQL file in your MySQL database

USE learnai_db;

-- Drop existing tables if you want to start fresh (OPTIONAL)
-- DROP TABLE IF EXISTS user_interests;
-- DROP TABLE IF EXISTS interest_categories;

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    interest_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_interest (user_id, interest_name),
    INDEX idx_user_id (user_id)
);

-- Create interest_categories table
CREATE TABLE IF NOT EXISTS interest_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert interest categories
INSERT INTO interest_categories (name, description, icon) VALUES
('Web Development', 'Build websites and web applications', 'globe'),
('Mobile Development', 'Create iOS and Android apps', 'smartphone'),
('Data Science', 'Analyze data and build ML models', 'bar-chart'),
('Artificial Intelligence', 'Machine learning and AI systems', 'cpu'),
('Cloud Computing', 'AWS, Azure, Google Cloud platforms', 'cloud'),
('Cybersecurity', 'Protect systems and networks', 'shield'),
('Game Development', 'Create games and interactive experiences', 'gamepad-2'),
('UI/UX Design', 'Design beautiful user interfaces', 'palette'),
('DevOps', 'Automation and deployment', 'settings'),
('Database Management', 'SQL, NoSQL, and data storage', 'database'),
('Programming Fundamentals', 'Learn to code from scratch', 'code'),
('Blockchain', 'Cryptocurrency and distributed systems', 'link')
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    icon = VALUES(icon);

-- Verify tables were created
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as category_count FROM interest_categories;

-- Show all categories
SELECT * FROM interest_categories ORDER BY name;
