-- ============================================================
-- ADD VIDEO LESSONS TO ALL COURSES
-- Run this in MySQL: source add_video_lessons.sql
-- ============================================================

USE learnai_db;

-- ============================================================
-- COURSE 1: Full Stack Web Development
-- Complete Sections 4 & 5 (React + Node.js)
-- ============================================================

-- Section 4: React.js Framework
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free)
SELECT s.id, 1, 'Introduction to React', 'What is React and why use it? Components, JSX, and the virtual DOM explained.', 'video', 'https://www.youtube.com/embed/Tn6-PIqc4UM', 28, 1, FALSE
FROM course_sections s WHERE s.course_id = 1 AND s.order_index = 4
ON DUPLICATE KEY UPDATE video_url = VALUES(video_url);

INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free)
SELECT s.id, 1, 'React Hooks (useState & useEffect)', 'Managing state and side effects in functional components.', 'video', 'https://www.youtube.com/embed/O6P86uwfdR0', 32, 2, FALSE
FROM course_sections s WHERE s.course_id = 1 AND s.order_index = 4
ON DUPLICATE KEY UPDATE video_url = VALUES(video_url);

INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free)
SELECT s.id, 1, 'React Router & Navigation', 'Building multi-page apps with React Router DOM.', 'video', 'https://www.youtube.com/embed/Law7wfdg_ls', 25, 3, FALSE
FROM course_sections s WHERE s.course_id = 1 AND s.order_index = 4
ON DUPLICATE KEY UPDATE video_url = VALUES(video_url);

-- Section 5: Backend with Node.js
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free)
SELECT s.id, 1, 'Node.js Introduction', 'What is Node.js? Event loop, modules, and npm explained.', 'video', 'https://www.youtube.com/embed/TlB_eWDSMt4', 30, 1, FALSE
FROM course_sections s WHERE s.course_id = 1 AND s.order_index = 5
ON DUPLICATE KEY UPDATE video_url = VALUES(video_url);

INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free)
SELECT s.id, 1, 'Express.js REST API', 'Building a REST API with Express.js, routes, and middleware.', 'video', 'https://www.youtube.com/embed/pKd0Rpw7O48', 35, 2, FALSE
FROM course_sections s WHERE s.course_id = 1 AND s.order_index = 5
ON DUPLICATE KEY UPDATE video_url = VALUES(video_url);

INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free)
SELECT s.id, 1, 'MySQL with Node.js', 'Connecting Node.js to MySQL database and performing CRUD operations.', 'video', 'https://www.youtube.com/embed/EN6Dx22cquE', 28, 3, FALSE
FROM course_sections s WHERE s.course_id = 1 AND s.order_index = 5
ON DUPLICATE KEY UPDATE video_url = VALUES(video_url);

-- Full Stack Quiz
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free)
SELECT s.id, 1, 'Full Stack Final Quiz', 'Test your complete Full Stack knowledge.', 'quiz', NULL, 20, 4, FALSE
FROM course_sections s WHERE s.course_id = 1 AND s.order_index = 5
ON DUPLICATE KEY UPDATE content_type = VALUES(content_type);

-- Quiz questions for Full Stack
INSERT IGNORE INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index)
SELECT l.id, 'What hook is used to manage state in React functional components?', 'useContext', 'useReducer', 'useState', 'useEffect', 'C', 'useState is the primary hook for adding state to functional components in React.', 1
FROM lessons l JOIN course_sections s ON l.section_id = s.id
WHERE s.course_id = 1 AND s.order_index = 5 AND l.content_type = 'quiz';

INSERT IGNORE INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index)
SELECT l.id, 'Which method is used to define a route in Express.js?', 'app.route()', 'app.get()', 'app.listen()', 'app.use()', 'B', 'app.get() (and app.post(), app.put() etc.) are used to define routes in Express.js.', 2
FROM lessons l JOIN course_sections s ON l.section_id = s.id
WHERE s.course_id = 1 AND s.order_index = 5 AND l.content_type = 'quiz';

INSERT IGNORE INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index)
SELECT l.id, 'What does REST stand for?', 'Remote Execution State Transfer', 'Representational State Transfer', 'Rapid Endpoint Service Technology', 'Relational Entity Service Type', 'B', 'REST stands for Representational State Transfer, an architectural style for distributed hypermedia systems.', 3
FROM lessons l JOIN course_sections s ON l.section_id = s.id
WHERE s.course_id = 1 AND s.order_index = 5 AND l.content_type = 'quiz';


-- ============================================================
-- UPDATE existing lessons that have wrong/missing video URLs
-- ============================================================

-- Course 1 - fix any NULL video_url lessons
UPDATE lessons SET video_url = 'https://www.youtube.com/embed/qz0aGYrrlhU'
WHERE course_id = 1 AND title LIKE '%Welcome%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/SWYqp7iY_Tc'
WHERE course_id = 1 AND title LIKE '%Development Environment%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/hJHvdBlSxug'
WHERE course_id = 1 AND title LIKE '%How the Web%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/UB1O30fR-EE'
WHERE course_id = 1 AND title LIKE '%HTML Basics%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/yfoY53QXEnI'
WHERE course_id = 1 AND title LIKE '%CSS Styling%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/srvUrASNj0s'
WHERE course_id = 1 AND title LIKE '%Responsive%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/W6NZfCO5SIk'
WHERE course_id = 1 AND title LIKE '%Variables%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/N8ap4k_1QEQ'
WHERE course_id = 1 AND title LIKE '%Functions%' AND (video_url IS NULL OR video_url = '');

UPDATE lessons SET video_url = 'https://www.youtube.com/embed/5fb2aPlgoys'
WHERE course_id = 1 AND title LIKE '%DOM%' AND (video_url IS NULL OR video_url = '');

-- ============================================================
-- UPDATE total_lessons count for all courses
-- ============================================================
UPDATE courses SET total_lessons = (
    SELECT COUNT(*) FROM lessons WHERE course_id = courses.id
);

-- ============================================================
-- VERIFY: Show all lessons with their video URLs
-- ============================================================
SELECT c.title as course, cs.title as section, l.title as lesson, l.content_type, 
       CASE WHEN l.video_url IS NOT NULL AND l.video_url != '' THEN '✓ Has Video' ELSE '✗ No Video' END as video_status
FROM lessons l
JOIN course_sections cs ON l.section_id = cs.id
JOIN courses c ON l.course_id = c.id
ORDER BY c.id, cs.order_index, l.order_index;
