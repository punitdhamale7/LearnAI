-- Course Reviews and Ratings Schema

-- Create course_reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course_review (user_id, course_id)
);

-- Add rating columns to courses table (check if they exist first)
SET @dbname = DATABASE();
SET @tablename = 'courses';
SET @columnname = 'average_rating';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE courses ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'total_reviews';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE courses ADD COLUMN total_reviews INT DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create index for faster queries (ignore if exists)
CREATE INDEX idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_user_id ON course_reviews(user_id);
CREATE INDEX idx_course_reviews_rating ON course_reviews(rating);

-- Sample reviews for Course 1 (Full Stack Web Development)
INSERT IGNORE INTO course_reviews (course_id, user_id, rating, review_text) VALUES
(1, 1, 5, 'Excellent course! The instructor explains everything clearly and the projects are very practical. Highly recommended for beginners.'),
(1, 2, 4, 'Great content and well-structured. Would have loved more advanced topics but overall very satisfied.'),
(1, 3, 5, 'Best web development course I have taken. The hands-on approach really helped me understand the concepts.');

-- Sample reviews for Course 2 (Python for Data Science)
INSERT IGNORE INTO course_reviews (course_id, user_id, rating, review_text) VALUES
(2, 1, 5, 'Perfect introduction to data science. The NumPy and Pandas sections were especially helpful.'),
(2, 3, 4, 'Good course with practical examples. Some sections could be more detailed but overall worth it.');

-- Sample reviews for Course 3 (AI & Machine Learning)
INSERT IGNORE INTO course_reviews (course_id, user_id, rating, review_text) VALUES
(3, 2, 5, 'Mind-blowing content! The deep learning section opened up a whole new world for me.'),
(3, 1, 5, 'Comprehensive and well-explained. The instructor makes complex topics easy to understand.');

-- Sample reviews for Course 4 (Mobile App Development)
INSERT IGNORE INTO course_reviews (course_id, user_id, rating, review_text) VALUES
(4, 2, 4, 'Solid course on React Native. Good balance between theory and practice.'),
(4, 3, 5, 'Loved this course! Built my first mobile app by the end. Very practical and engaging.');

-- Update average ratings and review counts
UPDATE courses c
SET 
    average_rating = (
        SELECT ROUND(AVG(rating), 2)
        FROM course_reviews
        WHERE course_id = c.id
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM course_reviews
        WHERE course_id = c.id
    );
