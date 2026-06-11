const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Admin: get all test series
router.get('/admin/list', (req, res) => {
    db.query('SELECT * FROM test_series ORDER BY start_datetime DESC', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true, tests: rows });
    });
});

// Admin: create test series
router.post('/admin/create', (req, res) => {
    const { title, description, start_datetime, duration_minutes } = req.body;
    if (!title || !start_datetime) return res.status(400).json({ success: false, message: 'Title and start date required' });
    db.query(
        'INSERT INTO test_series (title, description, start_datetime, duration_minutes) VALUES (?, ?, ?, ?)',
        [title, description || '', start_datetime, duration_minutes || 30],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'DB error' });
            res.json({ success: true, test_id: result.insertId });
        }
    );
});

// Admin: update test series
router.put('/admin/:testId', (req, res) => {
    const { title, description, start_datetime, duration_minutes } = req.body;
    db.query(
        'UPDATE test_series SET title=?, description=?, start_datetime=?, duration_minutes=? WHERE id=?',
        [title, description || '', start_datetime, duration_minutes || 30, req.params.testId],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: 'DB error' });
            res.json({ success: true });
        }
    );
});

// Admin: delete test series
router.delete('/admin/:testId', (req, res) => {
    db.query('DELETE FROM test_series WHERE id=?', [req.params.testId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true });
    });
});

// Admin: get questions for a test
router.get('/admin/:testId/questions', (req, res) => {
    db.query('SELECT * FROM test_series_questions WHERE test_series_id=? ORDER BY order_index', [req.params.testId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true, questions: rows });
    });
});

// Admin: save questions (replace all)
router.put('/admin/:testId/questions', (req, res) => {
    const { questions } = req.body;
    const testId = req.params.testId;
    db.query('DELETE FROM test_series_questions WHERE test_series_id=?', [testId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        if (!questions || !questions.length) {
            db.query('UPDATE test_series SET total_questions=0 WHERE id=?', [testId]);
            return res.json({ success: true });
        }
        const values = questions.map((q, i) => [
            testId, q.question_text, q.option_a || '', q.option_b || '',
            q.option_c || '', q.option_d || '', q.correct_answer || 'A', q.explanation || '', i + 1
        ]);
        db.query(
            'INSERT INTO test_series_questions (test_series_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES ?',
            [values], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: 'DB error' });
                db.query('UPDATE test_series SET total_questions=? WHERE id=?', [questions.length, testId]);
                res.json({ success: true });
            }
        );
    });
});

// Student: get upcoming/active tests (no correct answers)
router.get('/list', (req, res) => {
    db.query('SELECT id, title, description, start_datetime, duration_minutes, total_questions FROM test_series WHERE is_active=1 ORDER BY start_datetime DESC', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true, tests: rows });
    });
});

// Student: get test questions (only when test is live - no correct answers)
router.get('/:testId/questions', (req, res) => {
    const userId = req.headers['user-id'];
    db.query('SELECT id, start_datetime, duration_minutes FROM test_series WHERE id=?', [req.params.testId], (err, rows) => {
        if (err || !rows.length) return res.status(404).json({ success: false, message: 'Test not found' });
        const test = rows[0];
        const now = new Date();
        const start = new Date(test.start_datetime);
        const end = new Date(start.getTime() + test.duration_minutes * 60000);
        if (now < start) return res.status(403).json({ success: false, message: 'Test has not started yet' });
        if (now > end) return res.status(403).json({ success: false, message: 'Test has ended' });

        if (userId) {
            db.query('SELECT id FROM test_series_attempts WHERE test_series_id=? AND user_id=?', [req.params.testId, userId], (err2, attempts) => {
                if (attempts && attempts.length) return res.status(403).json({ success: false, message: 'You have already submitted this test' });
                fetchQuestions();
            });
        } else fetchQuestions();

        function fetchQuestions() {
            db.query(
                'SELECT id, question_text, option_a, option_b, option_c, option_d, order_index FROM test_series_questions WHERE test_series_id=? ORDER BY order_index',
                [req.params.testId], (err3, questions) => {
                    if (err3) return res.status(500).json({ success: false, message: 'DB error' });
                    res.json({ success: true, questions, test });
                }
            );
        }
    });
});

// Student: submit test
router.post('/:testId/submit', (req, res) => {
    const { user_id, answers, time_taken_seconds } = req.body;
    const testId = req.params.testId;
    if (!user_id) return res.status(400).json({ success: false, message: 'User ID required' });

    db.query('SELECT id FROM test_series_attempts WHERE test_series_id=? AND user_id=?', [testId, user_id], (err, existing) => {
        if (existing && existing.length) return res.status(400).json({ success: false, message: 'Already submitted' });

        db.query('SELECT * FROM test_series_questions WHERE test_series_id=? ORDER BY order_index', [testId], (err2, questions) => {
            if (err2) return res.status(500).json({ success: false, message: 'DB error' });

            let score = 0;
            const answerRows = [];
            questions.forEach(q => {
                const selected = answers[q.id] || null;
                const isCorrect = selected === q.correct_answer ? 1 : 0;
                if (isCorrect) score++;
                answerRows.push([null, q.id, selected, isCorrect]);
            });

            db.query(
                'INSERT INTO test_series_attempts (test_series_id, user_id, score, total_questions, time_taken_seconds) VALUES (?, ?, ?, ?, ?)',
                [testId, user_id, score, questions.length, time_taken_seconds || 0],
                (err3, result) => {
                    if (err3) return res.status(500).json({ success: false, message: 'DB error' });
                    const attemptId = result.insertId;
                    const rows = answerRows.map(r => [attemptId, r[1], r[2], r[3]]);
                    db.query('INSERT INTO test_series_answers (attempt_id, question_id, selected_answer, is_correct) VALUES ?', [rows], () => {
                        res.json({ success: true, score, total: questions.length });
                    });
                }
            );
        });
    });
});

// Student: get leaderboard for a test
router.get('/:testId/leaderboard', (req, res) => {
    const query = `
        SELECT u.full_name, u.avatar_url, a.score, a.total_questions, a.time_taken_seconds, a.submitted_at,
               RANK() OVER (ORDER BY a.score DESC, a.time_taken_seconds ASC) as rank_pos
        FROM test_series_attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.test_series_id = ?
        ORDER BY a.score DESC, a.time_taken_seconds ASC
        LIMIT 50
    `;
    db.query(query, [req.params.testId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true, leaderboard: rows });
    });
});

// Student: get result with correct answers (after test ends)
router.get('/:testId/result/:userId', (req, res) => {
    db.query('SELECT * FROM test_series WHERE id=?', [req.params.testId], (err, tests) => {
        if (err || !tests.length) return res.status(404).json({ success: false, message: 'Test not found' });
        const test = tests[0];
        const end = new Date(new Date(test.start_datetime).getTime() + test.duration_minutes * 60000);
        if (new Date() < end) return res.status(403).json({ success: false, message: 'Results available after test ends' });

        db.query('SELECT * FROM test_series_attempts WHERE test_series_id=? AND user_id=?', [req.params.testId, req.params.userId], (err2, attempts) => {
            if (err2 || !attempts.length) return res.status(404).json({ success: false, message: 'No attempt found' });
            const attempt = attempts[0];

            const query = `
                SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
                       q.correct_answer, q.explanation, a.selected_answer, a.is_correct
                FROM test_series_questions q
                LEFT JOIN test_series_answers a ON a.question_id = q.id AND a.attempt_id = ?
                WHERE q.test_series_id = ?
                ORDER BY q.order_index
            `;
            db.query(query, [attempt.id, req.params.testId], (err3, questions) => {
                if (err3) return res.status(500).json({ success: false, message: 'DB error' });
                res.json({ success: true, attempt, questions, test });
            });
        });
    });
});

module.exports = router;
