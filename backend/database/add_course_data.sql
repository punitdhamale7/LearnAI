-- Insert Sample Data for Courses 2, 3, and 4

-- ==========================================
-- COURSE 2: Python for Data Science
-- ==========================================
INSERT INTO course_sections (course_id, title, description, order_index) VALUES
(2, 'Python Fundamentals for Data Science', 'Basic Python concepts needed for data analysis', 1),
(2, 'Data Manipulation with Pandas', 'Learn how to clean and manipulate data', 2),
(2, 'Data Visualization', 'Visualize data using Matplotlib and Seaborn', 3);

-- Section 1: Python Fundamentals
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=2 AND order_index=1), 2, 'Introduction to Python for Data', 'Why Python is used in Data Science', 'video', 'https://www.youtube.com/embed/edxgJEhJwGs', 15, 1, TRUE),
((SELECT id FROM course_sections WHERE course_id=2 AND order_index=1), 2, 'NumPy Arrays and Operations', 'Working with numerical data efficiently', 'video', 'https://www.youtube.com/embed/QUT1VHiLmmI', 25, 2, FALSE);

-- Section 2: Data Manipulation with Pandas
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=2 AND order_index=2), 2, 'Pandas DataFrames', 'Creating and indexing DataFrames', 'video', 'https://www.youtube.com/embed/vmEHCJofslg', 30, 1, FALSE),
((SELECT id FROM course_sections WHERE course_id=2 AND order_index=2), 2, 'Cleaning Data', 'Handling missing values and duplicates', 'video', 'https://www.youtube.com/embed/bDhvCp3_lYw', 20, 2, FALSE);

-- Section 3: Data Visualization
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=2 AND order_index=3), 2, 'Matplotlib Basics', 'Creating basic plots and charts', 'video', 'https://www.youtube.com/embed/3Xc3CA655Ls', 20, 1, FALSE),
((SELECT id FROM course_sections WHERE course_id=2 AND order_index=3), 2, 'Data Science Quiz', 'Test your Python Data Science knowledge', 'quiz', NULL, 15, 2, FALSE);

-- Course 2 Quiz Questions
INSERT INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
((SELECT id FROM lessons WHERE course_id=2 AND content_type='quiz'), 'What is Pandas primarily used for?', 'Web development', 'Data analysis and manipulation', 'Database management', 'Creating 3D games', 'B', 'Pandas is a fast, powerful, flexible and easy to use open source data analysis and manipulation tool.', 1),
((SELECT id FROM lessons WHERE course_id=2 AND content_type='quiz'), 'Which library is best suited for numerical operations?', 'Requests', 'BeautifulSoup', 'NumPy', 'Flask', 'C', 'NumPy is the fundamental package for scientific computing with Python.', 2);


-- ==========================================
-- COURSE 3: AI & Machine Learning
-- ==========================================
INSERT INTO course_sections (course_id, title, description, order_index) VALUES
(3, 'Introduction to Machine Learning', 'Core concepts of ML and AI', 1),
(3, 'Supervised Learning', 'Classification and Regression', 2),
(3, 'Neural Networks & Deep Learning', 'Building basic neural networks', 3);

-- Section 1: Intro to ML
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=3 AND order_index=1), 3, 'What is Machine Learning?', 'Difference between AI, ML, and Deep Learning', 'video', 'https://www.youtube.com/embed/ukzFI9rgwfU', 20, 1, TRUE),
((SELECT id FROM course_sections WHERE course_id=3 AND order_index=1), 3, 'Scikit-Learn Basics', 'Using Scikit-Learn for basic models', 'video', 'https://www.youtube.com/embed/pqNCD_5r0IU', 25, 2, FALSE);

-- Section 2: Supervised Learning
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=3 AND order_index=2), 3, 'Linear Regression', 'Predicting continuous values', 'video', 'https://www.youtube.com/embed/kHwlB_j7Hkc', 30, 1, FALSE),
((SELECT id FROM course_sections WHERE course_id=3 AND order_index=2), 3, 'Logistic Regression', 'Classification problems', 'video', 'https://www.youtube.com/embed/yIYKR4sgzI8', 25, 2, FALSE);

-- Section 3: Neural Networks
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=3 AND order_index=3), 3, 'Introduction to Neural Networks', 'How artificial neurons work', 'video', 'https://www.youtube.com/embed/aircAruvnKk', 25, 1, FALSE),
((SELECT id FROM course_sections WHERE course_id=3 AND order_index=3), 3, 'Machine Learning Quiz', 'Test your Machine Learning knowledge', 'quiz', NULL, 15, 2, FALSE);

-- Course 3 Quiz Questions
INSERT INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
((SELECT id FROM lessons WHERE course_id=3 AND content_type='quiz'), 'Which of the following is an example of supervised learning?', 'Clustering', 'Dimensionality Reduction', 'Classification', 'Association', 'C', 'Classification involves predicting a discrete label based on input features using labeled training data.', 1),
((SELECT id FROM lessons WHERE course_id=3 AND content_type='quiz'), 'What does a neural network use to update its weights?', 'Linear Search', 'Backpropagation', 'Sorting', 'Random Forest', 'B', 'Backpropagation is the algorithm used to calculate gradients and update weights in neural networks.', 2);


-- ==========================================
-- COURSE 4: Mobile App Development
-- ==========================================
INSERT INTO course_sections (course_id, title, description, order_index) VALUES
(4, 'Getting Started with React Native', 'Setup and basic concepts', 1),
(4, 'UI Components and Layouts', 'Building the user interface', 2),
(4, 'Navigation and State', 'Managing app flow and data', 3);

-- Section 1: Intro
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=4 AND order_index=1), 4, 'Introduction to React Native', 'Cross-platform mobile development', 'video', 'https://www.youtube.com/embed/0-S5a0eXPoc', 15, 1, TRUE),
((SELECT id FROM course_sections WHERE course_id=4 AND order_index=1), 4, 'Setting up the Environment', 'Installing Node, Watchman, and CLI', 'video', 'https://www.youtube.com/embed/q0oEIn3k3R4', 20, 2, FALSE);

-- Section 2: UI
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=4 AND order_index=2), 4, 'Core Components (View, Text)', 'Basic building blocks of React Native', 'video', 'https://www.youtube.com/embed/Hf4MJH0jDb4', 22, 1, FALSE),
((SELECT id FROM course_sections WHERE course_id=4 AND order_index=2), 4, 'Flexbox in React Native', 'Layout and styling', 'video', 'https://www.youtube.com/embed/WlIEtIuHioU', 25, 2, FALSE);

-- Section 3: Navigation
INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM course_sections WHERE course_id=4 AND order_index=3), 4, 'React Navigation', 'Moving between screens', 'video', 'https://www.youtube.com/embed/5HpdE8cT5L4', 30, 1, FALSE),
((SELECT id FROM course_sections WHERE course_id=4 AND order_index=3), 4, 'React Native Quiz', 'Test your React Native knowledge', 'quiz', NULL, 15, 2, FALSE);

-- Course 4 Quiz Questions
INSERT INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
((SELECT id FROM lessons WHERE course_id=4 AND content_type='quiz'), 'Which component is used as a container in React Native?', '<div>', '<Container>', '<View>', '<Box>', 'C', '<View> is the fundamental component for building a UI in React Native, analogous to <div> in HTML.', 1),
((SELECT id FROM lessons WHERE course_id=4 AND content_type='quiz'), 'What styling system does React Native use for layout?', 'CSS Grid', 'Flexbox', 'Bootstrap', 'Tailwind', 'B', 'React Native uses Flexbox to easily layout components on different screen sizes.', 2);
