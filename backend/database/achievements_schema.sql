-- Achievements System Schema

-- Achievements Table (Predefined achievements)
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category ENUM('courses', 'lessons', 'streak', 'social', 'special') DEFAULT 'courses',
    requirement_type ENUM('courses_completed', 'lessons_completed', 'days_streak', 'enrollments', 'quiz_passed', 'messages_sent', 'profile_complete') NOT NULL,
    requirement_value INT NOT NULL,
    points INT DEFAULT 0,
    rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements (Unlocked achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_notified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user (user_id),
    INDEX idx_achievement (achievement_id)
);

-- User Stats (For tracking progress)
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_courses_completed INT DEFAULT 0,
    total_lessons_completed INT DEFAULT 0,
    total_enrollments INT DEFAULT 0,
    total_quiz_passed INT DEFAULT 0,
    total_messages_sent INT DEFAULT 0,
    current_streak_days INT DEFAULT 0,
    longest_streak_days INT DEFAULT 0,
    last_activity_date DATE,
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Predefined Achievements

-- Course Achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('First Steps', 'Enroll in your first course', '🎯', 'courses', 'enrollments', 1, 10, 'common'),
('Learning Enthusiast', 'Enroll in 5 courses', '📚', 'courses', 'enrollments', 5, 50, 'rare'),
('Course Collector', 'Enroll in 10 courses', '🎓', 'courses', 'enrollments', 10, 100, 'epic'),
('Course Master', 'Complete your first course', '🏆', 'courses', 'courses_completed', 1, 100, 'rare'),
('Dedicated Learner', 'Complete 3 courses', '⭐', 'courses', 'courses_completed', 3, 300, 'epic'),
('Knowledge Seeker', 'Complete 5 courses', '🌟', 'courses', 'courses_completed', 5, 500, 'legendary'),
('Elite Scholar', 'Complete 10 courses', '👑', 'courses', 'courses_completed', 10, 1000, 'legendary');

-- Lesson Achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('First Lesson', 'Complete your first lesson', '📖', 'lessons', 'lessons_completed', 1, 5, 'common'),
('Quick Learner', 'Complete 10 lessons', '⚡', 'lessons', 'lessons_completed', 10, 50, 'common'),
('Lesson Warrior', 'Complete 50 lessons', '🔥', 'lessons', 'lessons_completed', 50, 250, 'rare'),
('Lesson Master', 'Complete 100 lessons', '💎', 'lessons', 'lessons_completed', 100, 500, 'epic'),
('Lesson Legend', 'Complete 250 lessons', '🚀', 'lessons', 'lessons_completed', 250, 1000, 'legendary');

-- Quiz Achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('Quiz Novice', 'Pass your first quiz', '✅', 'lessons', 'quiz_passed', 1, 20, 'common'),
('Quiz Expert', 'Pass 10 quizzes', '🎯', 'lessons', 'quiz_passed', 10, 100, 'rare'),
('Quiz Master', 'Pass 25 quizzes', '🏅', 'lessons', 'quiz_passed', 25, 250, 'epic');

-- Streak Achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('Consistent', 'Maintain a 3-day learning streak', '🔥', 'streak', 'days_streak', 3, 30, 'common'),
('Dedicated', 'Maintain a 7-day learning streak', '⚡', 'streak', 'days_streak', 7, 70, 'rare'),
('Unstoppable', 'Maintain a 30-day learning streak', '💪', 'streak', 'days_streak', 30, 300, 'epic'),
('Legendary Streak', 'Maintain a 100-day learning streak', '👑', 'streak', 'days_streak', 100, 1000, 'legendary');

-- Social Achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('Social Butterfly', 'Send 10 messages', '💬', 'social', 'messages_sent', 10, 50, 'common'),
('Communicator', 'Send 50 messages', '📱', 'social', 'messages_sent', 50, 150, 'rare');

-- Special Achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('Profile Complete', 'Complete your profile information', '👤', 'special', 'profile_complete', 1, 25, 'common'),
('Welcome Aboard', 'Join the LearnAI platform', '🎉', 'special', 'enrollments', 0, 5, 'common');

-- Initialize user stats for existing users
INSERT INTO user_stats (user_id, total_enrollments)
SELECT id, 0 FROM users
ON DUPLICATE KEY UPDATE user_id = user_id;
