-- Database Performance Indexes
-- Run this to speed up common queries

-- Users table indexes
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_username (username);
ALTER TABLE users ADD INDEX idx_created_at (created_at);

-- Courses table indexes
ALTER TABLE courses ADD INDEX idx_category (category);
ALTER TABLE courses ADD INDEX idx_difficulty (difficulty_level);
ALTER TABLE courses ADD INDEX idx_rating (average_rating);
ALTER TABLE courses ADD INDEX idx_price (price);
ALTER TABLE courses ADD INDEX idx_created (created_at);

-- Enrollments table indexes
ALTER TABLE enrollments ADD INDEX idx_user_course (user_id, course_id);
ALTER TABLE enrollments ADD INDEX idx_progress (progress_percentage);
ALTER TABLE enrollments ADD INDEX idx_enrolled_date (enrolled_at);

-- Lessons table indexes
ALTER TABLE lessons ADD INDEX idx_course (course_id);
ALTER TABLE lessons ADD INDEX idx_order (order_index);
ALTER TABLE lessons ADD INDEX idx_type (lesson_type);

-- Progress table indexes (if exists)
-- ALTER TABLE lesson_progress ADD INDEX idx_user_lesson (user_id, lesson_id);
-- ALTER TABLE lesson_progress ADD INDEX idx_completed (completed);

-- Reviews table indexes
ALTER TABLE reviews ADD INDEX idx_course_rating (course_id, rating);
ALTER TABLE reviews ADD INDEX idx_user (user_id);
ALTER TABLE reviews ADD INDEX idx_created (created_at);

-- Messages table indexes
ALTER TABLE messages ADD INDEX idx_sender (sender_id);
ALTER TABLE messages ADD INDEX idx_receiver (receiver_id);
ALTER TABLE messages ADD INDEX idx_conversation (sender_id, receiver_id);
ALTER TABLE messages ADD INDEX idx_created (created_at);
ALTER TABLE messages ADD INDEX idx_read_status (is_read);

-- Achievements table indexes
ALTER TABLE achievements ADD INDEX idx_category (category);
ALTER TABLE achievements ADD INDEX idx_rarity (rarity);

-- User achievements table indexes
ALTER TABLE user_achievements ADD INDEX idx_user (user_id);
ALTER TABLE user_achievements ADD INDEX idx_achievement (achievement_id);
ALTER TABLE user_achievements ADD INDEX idx_unlocked (unlocked_at);

-- User stats table indexes
ALTER TABLE user_stats ADD INDEX idx_user (user_id);
ALTER TABLE user_stats ADD INDEX idx_points (total_points);
ALTER TABLE user_stats ADD INDEX idx_streak (current_streak);

-- Password reset tokens indexes
ALTER TABLE password_reset_tokens ADD INDEX idx_token (token);
ALTER TABLE password_reset_tokens ADD INDEX idx_user (user_id);
ALTER TABLE password_reset_tokens ADD INDEX idx_expires (expires_at);
ALTER TABLE password_reset_tokens ADD INDEX idx_used (used);

-- Composite indexes for common queries
ALTER TABLE enrollments ADD INDEX idx_user_progress (user_id, progress_percentage);
ALTER TABLE courses ADD INDEX idx_category_rating (category, average_rating);
ALTER TABLE reviews ADD INDEX idx_course_created (course_id, created_at);

-- Full-text search indexes for better search performance
ALTER TABLE courses ADD FULLTEXT INDEX idx_search_title (title);
ALTER TABLE courses ADD FULLTEXT INDEX idx_search_description (description);
ALTER TABLE courses ADD FULLTEXT INDEX idx_search_all (title, description, instructor_name);

-- Show all indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'learnai_db'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;
