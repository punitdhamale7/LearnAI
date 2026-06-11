CREATE TABLE IF NOT EXISTS test_series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    total_questions INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_series_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_series_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500),
    option_d VARCHAR(500),
    correct_answer CHAR(1) NOT NULL DEFAULT 'A',
    explanation TEXT,
    order_index INT DEFAULT 1,
    FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_series_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_series_id INT NOT NULL,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    time_taken_seconds INT DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attempt (test_series_id, user_id),
    FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_series_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer CHAR(1),
    is_correct TINYINT(1) DEFAULT 0,
    FOREIGN KEY (attempt_id) REFERENCES test_series_attempts(id) ON DELETE CASCADE
);
