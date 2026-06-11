-- User Interests Schema
-- Stores user-selected interests for personalized recommendations

-- Table to store available interest categories
CREATE TABLE IF NOT EXISTS interest_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store user's selected interests
CREATE TABLE IF NOT EXISTS user_interests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    interest_category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (interest_category_id) REFERENCES interest_categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_interest (user_id, interest_category_id)
);

-- Insert default interest categories
INSERT INTO interest_categories (name, description, icon) VALUES
('Web Development', 'HTML, CSS, JavaScript, React, Node.js', 'Code'),
('Mobile Development', 'iOS, Android, React Native, Flutter', 'Smartphone'),
('Data Science', 'Python, Machine Learning, AI, Analytics', 'BarChart3'),
('Cloud Computing', 'AWS, Azure, Google Cloud, DevOps', 'Cloud'),
('Cybersecurity', 'Network Security, Ethical Hacking, Cryptography', 'Shield'),
('Database', 'SQL, NoSQL, MongoDB, PostgreSQL', 'Database'),
('UI/UX Design', 'User Interface, User Experience, Figma', 'Palette'),
('Game Development', 'Unity, Unreal Engine, Game Design', 'Gamepad2'),
('Blockchain', 'Cryptocurrency, Smart Contracts, Web3', 'Link'),
('DevOps', 'CI/CD, Docker, Kubernetes, Automation', 'GitBranch'),
('Programming Languages', 'Python, Java, C++, Go, Rust', 'Terminal'),
('Business & Marketing', 'Digital Marketing, SEO, Analytics', 'TrendingUp')
ON DUPLICATE KEY UPDATE name=name;
