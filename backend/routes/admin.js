const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');


router.get('/admin/lessons/:lessonId/questions', (req, res) => {
    const query = `
        SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index
        FROM quiz_questions WHERE lesson_id = ? ORDER BY order_index
    `;
    db.query(query, [req.params.lessonId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true, questions: results });
    });
});

router.get('/stats/users', (req, res) => {
    db.query('SELECT COUNT(*) as count FROM users', (err, r) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, count: r[0].count });
    });
});

router.get('/stats/enrollments', (req, res) => {
    db.query('SELECT COUNT(*) as count FROM enrollments', (err, r) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, count: r[0].count });
    });
});

router.get('/stats/reviews', (req, res) => {
    db.query('SELECT COUNT(*) as count FROM course_reviews', (err, r) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, count: r[0].count });
    });
});


router.get('/analytics', (req, res) => {
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        totalCourses: 'SELECT COUNT(*) as count FROM courses',
        totalEnrollments: 'SELECT COUNT(*) as count FROM enrollments',
        totalReviews: 'SELECT COUNT(*) as count FROM course_reviews',
        avgRating: 'SELECT AVG(rating) as avg FROM course_reviews',
        recentEnrollments: `SELECT DATE(enrolled_at) as date, COUNT(*) as count FROM enrollments WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(enrolled_at) ORDER BY date DESC`
    };
    const analytics = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, results) => {
            if (!err) analytics[key] = key === 'recentEnrollments' ? results : results[0];
            if (++completed === total) res.json({ success: true, analytics });
        });
    });
});


router.get('/users', (req, res) => {
    const query = `
        SELECT id, full_name, username, email, phone, created_at, last_login,
               (SELECT COUNT(*) FROM enrollments WHERE user_id = users.id) as enrollments_count
        FROM users ORDER BY created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, users: results });
    });
});

router.post('/users', async (req, res) => {
    const { full_name, username, email, phone, password } = req.body;
    if (!full_name || !username || !email || !password)
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (full_name, username, email, phone, password) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, email, phone, hashedPassword], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Username or email already exists' });
                    return res.status(500).json({ success: false, message: 'Error creating user' });
                }
                res.json({ success: true, message: 'User created successfully', user_id: result.insertId });
            });
    } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.put('/users/:userId', (req, res) => {
    const { full_name, username, email, phone } = req.body;
    db.query('UPDATE users SET full_name=?, username=?, email=?, phone=? WHERE id=?',
        [full_name, username, email, phone, req.params.userId], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Username or email already exists' });
                return res.status(500).json({ success: false, message: 'Error updating user' });
            }
            res.json({ success: true, message: 'User updated successfully' });
        });
});

router.delete('/users/:userId', (req, res) => {
    db.query('DELETE FROM users WHERE id=?', [req.params.userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting user' });
        res.json({ success: true, message: 'User deleted successfully' });
    });
});


router.post('/courses', (req, res) => {
    const { title, description, instructor_name, difficulty_level, price, duration_hours, total_lessons } = req.body;
    if (!title || !instructor_name)
        return res.status(400).json({ success: false, message: 'Title and instructor are required' });
    db.query(
        'INSERT INTO courses (title, description, instructor_name, difficulty_level, price, duration_hours, total_lessons) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, instructor_name, difficulty_level || 'Beginner', price || 0, duration_hours || 0, total_lessons || 0],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'Error creating course' });
            res.json({ success: true, message: 'Course created successfully', course_id: result.insertId });
        });
});

router.put('/courses/:courseId', (req, res) => {
    const { title, description, instructor_name, difficulty_level, price, duration_hours, total_lessons } = req.body;
    db.query(
        'UPDATE courses SET title=?, description=?, instructor_name=?, difficulty_level=?, price=?, duration_hours=?, total_lessons=? WHERE id=?',
        [title, description, instructor_name, difficulty_level, price, duration_hours, total_lessons, req.params.courseId],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Error updating course' });
            res.json({ success: true, message: 'Course updated successfully' });
        });
});

router.delete('/courses/:courseId', (req, res) => {
    db.query('DELETE FROM courses WHERE id=?', [req.params.courseId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting course' });
        res.json({ success: true, message: 'Course deleted successfully' });
    });
});


router.post('/courses/:courseId/sections', (req, res) => {
    const { title, order_index } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Section title required' });
    db.query('INSERT INTO course_sections (course_id, title, order_index) VALUES (?, ?, ?)',
        [req.params.courseId, title, order_index || 1], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'DB error' });
            res.json({ success: true, section_id: result.insertId });
        });
});

router.post('/sections/:sectionId/lessons', (req, res) => {
    const { course_id, title, description, content_type, video_url, article_content, duration_minutes, order_index } = req.body;
    if (!title || !course_id) return res.status(400).json({ success: false, message: 'Title and course_id required' });
    db.query(
        'INSERT INTO lessons (section_id, course_id, title, description, content_type, video_url, article_content, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.sectionId, course_id, title, description || '', content_type || 'video', video_url || null, article_content || null, duration_minutes || 10, order_index || 1],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'DB error' });

            db.query('UPDATE courses SET total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = ?) WHERE id = ?', [course_id, course_id]);

            const recalcQuery = `
                UPDATE enrollments e
                SET
                    completed_lessons = (
                        SELECT COUNT(*) FROM lesson_progress lp
                        WHERE lp.user_id = e.user_id AND lp.course_id = e.course_id AND lp.is_completed = TRUE
                    ),
                    progress_percentage = (
                        SELECT ROUND(
                            (COUNT(CASE WHEN lp.is_completed = TRUE THEN 1 END) / NULLIF((SELECT COUNT(*) FROM lessons WHERE course_id = ?), 0)) * 100
                        , 2)
                        FROM lessons l
                        LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = e.user_id
                        WHERE l.course_id = ?
                    ),
                    status = CASE
                        WHEN (
                            SELECT ROUND(
                                (COUNT(CASE WHEN lp2.is_completed = TRUE THEN 1 END) / NULLIF((SELECT COUNT(*) FROM lessons WHERE course_id = ?), 0)) * 100
                            , 2)
                            FROM lessons l2
                            LEFT JOIN lesson_progress lp2 ON l2.id = lp2.lesson_id AND lp2.user_id = e.user_id
                            WHERE l2.course_id = ?
                        ) >= 100 THEN 'completed'
                        ELSE 'active'
                    END
                WHERE e.course_id = ?
            `;
            db.query(recalcQuery, [course_id, course_id, course_id, course_id, course_id, course_id], (err2) => {
                if (err2) console.error('Error recalculating progress:', err2);
            });

            res.json({ success: true, lesson_id: result.insertId });
        });
});

router.post('/lessons/:lessonId/questions', (req, res) => {
    const { questions } = req.body;
    if (!questions || !questions.length) return res.status(400).json({ success: false, message: 'No questions provided' });
    const values = questions.map((q, i) => [
        req.params.lessonId, q.question_text, q.option_a || '', q.option_b || '',
        q.option_c || '', q.option_d || '', q.correct_answer || 'A', q.explanation || '', i + 1
    ]);
    db.query(
        'INSERT INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES ?',
        [values], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'DB error' });
            res.json({ success: true, message: `${questions.length} questions added` });
        });
});

router.put('/lessons/:lessonId/questions', (req, res) => {
    const { questions } = req.body;
    const lessonId = req.params.lessonId;
    db.query('DELETE FROM quiz_questions WHERE lesson_id = ?', [lessonId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        if (!questions || !questions.length) return res.json({ success: true, message: 'Questions cleared' });
        const values = questions.map((q, i) => [
            lessonId, q.question_text, q.option_a || '', q.option_b || '',
            q.option_c || '', q.option_d || '', q.correct_answer || 'A', q.explanation || '', i + 1
        ]);
        db.query(
            'INSERT INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES ?',
            [values], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: 'DB error' });
                res.json({ success: true, message: `${questions.length} questions saved` });
            });
    });
});

router.put('/lessons/:lessonId', (req, res) => {
    const { title, description, video_url, article_content, duration_minutes, content_type } = req.body;
    db.query(
        'UPDATE lessons SET title=?, description=?, video_url=?, article_content=?, duration_minutes=?, content_type=? WHERE id=?',
        [title, description, video_url, article_content, duration_minutes, content_type, req.params.lessonId],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: 'DB error' });
            res.json({ success: true });
        });
});

router.delete('/lessons/:lessonId', (req, res) => {
    const lessonId = req.params.lessonId;
    db.query('SELECT course_id FROM lessons WHERE id = ?', [lessonId], (err, rows) => {
        if (err || !rows.length) return res.status(404).json({ success: false, message: 'Lesson not found' });
        const courseId = rows[0].course_id;
        db.query('DELETE FROM lessons WHERE id = ?', [lessonId], (err2) => {
            if (err2) return res.status(500).json({ success: false, message: 'DB error' });
            db.query('UPDATE courses SET total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = ?) WHERE id = ?', [courseId, courseId]);
            res.json({ success: true, message: 'Lesson deleted' });
        });
    });
});

router.get('/reviews', (req, res) => {
    const query = `
        SELECT cr.id, cr.rating, cr.review_text, cr.created_at,
               u.full_name as user_name, c.title as course_title
        FROM course_reviews cr
        JOIN users u ON cr.user_id = u.id
        JOIN courses c ON cr.course_id = c.id
        ORDER BY cr.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, reviews: results });
    });
});

router.delete('/reviews/:reviewId', (req, res) => {
    db.query('DELETE FROM course_reviews WHERE id=?', [req.params.reviewId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error deleting review' });
        res.json({ success: true, message: 'Review deleted successfully' });
    });
});


router.get('/achievements', (req, res) => {
    db.query('SELECT * FROM achievements ORDER BY category, points', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, achievements: results });
    });
});


router.post('/login', (req, res) => {
    res.status(301).json({ success: false, message: 'Use /api/auth/admin-login' });
});

module.exports = router;
