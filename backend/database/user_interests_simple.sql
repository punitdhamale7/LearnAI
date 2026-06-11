-- Simple User Interests Table
CREATE TABLE IF NOT EXISTS user_interests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    interest_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_interest (user_id, interest_name)
);

-- Predefined interest categories
CREATE TABLE IF NOT EXISTS interest_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert popular interest categories
INSERT INTO interest_categories (name, description, icon) VALUES
('Web Development', 'Build websites and web applications', 'globe'),
('Mobile Development', 'Create iOS and Android apps', 'smartphone'),
('Data Science', 'Analyze data and build ML models', 'bar-chart'),
('Artificial Intelligence', 'Machine learning and AI systems', 'cpu'),
('Cloud Computing', 'AWS, Azure, Google Cloud platforms', 'cloud'),
('Cybersecurity', 'Protect systems and networks', 'shield'),
('Game Development', 'Create games and interactive experiences', 'gamepad'),
('UI/UX Design', 'Design beautiful user interfaces', 'palette'),
('DevOps', 'Automation and deployment', 'settings'),
('Blockchain', 'Cryptocurrency and distributed systems', 'link'),
('Database Management', 'SQL, NoSQL, and data storage', 'database'),
('Programming Fundamentals', 'Learn to code from scratch', 'code')
ON DUPLICATE KEY UPDATE name=name;
