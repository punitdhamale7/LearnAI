-- Create Database
CREATE DATABASE IF NOT EXISTS learnai_db;
USE learnai_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
    bio TEXT,
    college VARCHAR(200),
    degree VARCHAR(100),
    branch VARCHAR(100),
    specialization VARCHAR(100),
    year_of_study VARCHAR(50),
    graduation_year INT,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    twitter_url VARCHAR(255),
    website_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- User Skills Table
CREATE TABLE IF NOT EXISTS user_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_name)
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructor_name VARCHAR(100),
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    price DECIMAL(10, 2) DEFAULT 0.00,
    duration_hours INT,
    total_lessons INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_students INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percentage INT DEFAULT 0,
    completed_lessons INT DEFAULT 0,
    last_accessed TIMESTAMP NULL,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id)
);

-- Insert Sample Courses
INSERT INTO courses (title, description, instructor_name, difficulty_level, price, duration_hours, total_lessons, rating, total_students) VALUES
('Full Stack Web Development', 'Master HTML, CSS, JavaScript, React, Node.js and build real-world projects', 'John Smith', 'Beginner', 49.99, 40, 18, 4.8, 12450),
('Python for Data Science', 'Learn Python, NumPy, Pandas, and machine learning fundamentals', 'Sarah Johnson', 'Intermediate', 59.99, 35, 20, 4.9, 18320),
('AI & Machine Learning', 'Deep dive into neural networks, deep learning, and AI applications', 'Dr. Michael Chen', 'Advanced', 79.99, 50, 25, 4.7, 8750),
('Mobile App Development', 'Build iOS and Android apps with React Native and Flutter', 'Emily Davis', 'Intermediate', 54.99, 45, 22, 4.6, 9890);
