-- Course Content/Lessons System Schema

-- Course Sections Table (Modules/Chapters)
CREATE TABLE IF NOT EXISTS course_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_order (order_index)
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type ENUM('video', 'article', 'quiz', 'assignment') DEFAULT 'video',
    video_url TEXT,
    article_content LONGTEXT,
    duration_minutes INT DEFAULT 0,
    order_index INT NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_section (section_id),
    INDEX idx_course (course_id),
    INDEX idx_order (order_index)
);

-- Lesson Completion Tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    course_id INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    watch_time_seconds INT DEFAULT 0,
    last_position_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id),
    INDEX idx_user (user_id),
    INDEX idx_lesson (lesson_id),
    INDEX idx_course (course_id)
);

-- Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500),
    option_b VARCHAR(500),
    option_c VARCHAR(500),
    option_d VARCHAR(500),
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    explanation TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    INDEX idx_lesson (lesson_id)
);

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_lesson (lesson_id)
);

-- Insert Sample Data for Course 1 (Full Stack Web Development)
INSERT INTO course_sections (course_id, title, description, order_index) VALUES
(1, 'Introduction to Web Development', 'Get started with the basics of web development', 1),
(1, 'HTML & CSS Fundamentals', 'Learn the building blocks of web pages', 2),
(1, 'JavaScript Basics', 'Master the programming language of the web', 3),
(1, 'React.js Framework', 'Build modern user interfaces with React', 4),
(1, 'Backend with Node.js', 'Create server-side applications', 5);

-- Insert Sample Lessons for Section 1
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
(1, 1, 'Welcome to the Course', 'Introduction and course overview', 'video', 'https://www.youtube.com/embed/qz0aGYrrlhU', 10, 1, TRUE),
(1, 1, 'Setting Up Your Development Environment', 'Install VS Code, Node.js, and other tools', 'video', 'https://www.youtube.com/embed/SWYqp7iY_Tc', 15, 2, TRUE),
(1, 1, 'How the Web Works', 'Understanding clients, servers, and HTTP', 'video', 'https://www.youtube.com/embed/hJHvdBlSxug', 12, 3, FALSE);

-- Insert Sample Lessons for Section 2
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
(2, 1, 'HTML Basics', 'Learn HTML tags and structure', 'video', 'https://www.youtube.com/embed/UB1O30fR-EE', 20, 1, FALSE),
(2, 1, 'CSS Styling', 'Style your web pages with CSS', 'video', 'https://www.youtube.com/embed/yfoY53QXEnI', 25, 2, FALSE),
(2, 1, 'Responsive Design', 'Make your websites mobile-friendly', 'video', 'https://www.youtube.com/embed/srvUrASNj0s', 18, 3, FALSE);

-- Insert Sample Lessons for Section 3
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
(3, 1, 'JavaScript Variables and Data Types', 'Understanding variables, strings, numbers', 'video', 'https://www.youtube.com/embed/W6NZfCO5SIk', 22, 1, FALSE),
(3, 1, 'Functions and Control Flow', 'Learn functions, if statements, loops', 'video', 'https://www.youtube.com/embed/N8ap4k_1QEQ', 28, 2, FALSE),
(3, 1, 'DOM Manipulation', 'Interact with HTML elements using JavaScript', 'video', 'https://www.youtube.com/embed/5fb2aPlgoys', 24, 3, FALSE);

-- Insert Sample Quiz Questions
INSERT INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
(1, 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'A', 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.', 1),
(1, 'Which programming language is known as the language of the web?', 'Python', 'Java', 'JavaScript', 'C++', 'C', 'JavaScript is the programming language that runs in web browsers and is essential for web development.', 2);
