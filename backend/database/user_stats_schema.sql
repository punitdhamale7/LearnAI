-- User Stats Table (tracks lesson completions, quiz passes, streaks, enrollments)
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_lessons_completed INT DEFAULT 0,
    total_quiz_passed INT DEFAULT 0,
    total_enrollments INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    last_activity_date DATE NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fix progress_percentage column type from INT to DECIMAL(5,2) for accuracy
ALTER TABLE enrollments
    MODIFY COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.00;
