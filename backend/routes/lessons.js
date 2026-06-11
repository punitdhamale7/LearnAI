const express = require('express');
const router = express.Router();
const db = require('../config/database');


router.get('/:lessonId', (req, res) => {
    const lessonId = req.params.lessonId;

    const query = `
        SELECT 
            l.*,
            cs.title as section_title,
            c.title as course_title
        FROM lessons l
        JOIN course_sections cs ON l.section_id = cs.id
        JOIN courses c ON l.course_id = c.id
        WHERE l.id = ?
    `;

    db.query(query, [lessonId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            lesson: results[0]
        });
    });
});


router.get('/:lessonId/progress/:userId', (req, res) => {
    const { lessonId, userId } = req.params;

    const query = `
        SELECT 
            l.*,
            cs.title as section_title,
            c.title as course_title,
            lp.is_completed,
            lp.completed_at,
            lp.watch_time_seconds,
            lp.last_position_seconds
        FROM lessons l
        JOIN course_sections cs ON l.section_id = cs.id
        JOIN courses c ON l.course_id = c.id
        LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
        WHERE l.id = ?
    `;

    db.query(query, [userId, lessonId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            lesson: results[0]
        });
    });
});


router.post('/:lessonId/complete', (req, res) => {
    const lessonId = req.params.lessonId;
    const { user_id, course_id } = req.body;

    if (!user_id || !course_id) {
        return res.status(400).json({
            success: false,
            message: 'User ID and Course ID are required'
        });
    }

    
    const checkQuery = 'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?';

    db.query(checkQuery, [user_id, lessonId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length > 0) {
            
            const updateQuery = `
                UPDATE lesson_progress 
                SET is_completed = TRUE, completed_at = NOW() 
                WHERE user_id = ? AND lesson_id = ?
            `;

            db.query(updateQuery, [user_id, lessonId], (err) => {
                if (err) {
                    console.error('Error updating progress:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating progress'
                    });
                }

                updateEnrollmentProgress(user_id, course_id);

                
                if (global.updateUserStats) {
                    global.updateUserStats(user_id, 'total_lessons_completed', 1);
                    global.updateStreak(user_id);
                }

                res.json({
                    success: true,
                    message: 'Lesson marked as completed'
                });
            });
        } else {
            
            const insertQuery = `
                INSERT INTO lesson_progress (user_id, lesson_id, course_id, is_completed, completed_at) 
                VALUES (?, ?, ?, TRUE, NOW())
            `;

            db.query(insertQuery, [user_id, lessonId, course_id], (err) => {
                if (err) {
                    console.error('Error inserting progress:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error saving progress'
                    });
                }

                updateEnrollmentProgress(user_id, course_id);

                
                if (global.updateUserStats) {
                    global.updateUserStats(user_id, 'total_lessons_completed', 1);
                    global.updateStreak(user_id);
                }

                res.json({
                    success: true,
                    message: 'Lesson marked as completed'
                });
            });
        }
    });
});


router.put('/:lessonId/progress', (req, res) => {
    const lessonId = req.params.lessonId;
    const { user_id, course_id, watch_time_seconds, last_position_seconds } = req.body;

    if (!user_id || !course_id) {
        return res.status(400).json({
            success: false,
            message: 'User ID and Course ID are required'
        });
    }

    const query = `
        INSERT INTO lesson_progress (user_id, lesson_id, course_id, watch_time_seconds, last_position_seconds)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            watch_time_seconds = ?,
            last_position_seconds = ?
    `;

    db.query(query, [user_id, lessonId, course_id, watch_time_seconds, last_position_seconds, watch_time_seconds, last_position_seconds], (err) => {
        if (err) {
            console.error('Error updating watch progress:', err);
            return res.status(500).json({
                success: false,
                message: 'Error updating progress'
            });
        }

        res.json({
            success: true,
            message: 'Progress updated'
        });
    });
});


router.get('/:lessonId/quiz', (req, res) => {
    const lessonId = req.params.lessonId;

    const query = `
        SELECT id, question_text, option_a, option_b, option_c, option_d, order_index
        FROM quiz_questions
        WHERE lesson_id = ?
        ORDER BY order_index
    `;

    db.query(query, [lessonId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            questions: results
        });
    });
});


router.post('/:lessonId/quiz/submit', (req, res) => {
    const lessonId = req.params.lessonId;
    const { user_id, answers } = req.body;

    if (!user_id || !answers) {
        return res.status(400).json({
            success: false,
            message: 'User ID and answers are required'
        });
    }

    
    const query = 'SELECT id, question_text, correct_answer, explanation FROM quiz_questions WHERE lesson_id = ? ORDER BY order_index';

    db.query(query, [lessonId], (err, questions) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        let score = 0;
        const results = [];

        questions.forEach(q => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            if (isCorrect) score++;

            results.push({
                question_id: q.id,
                question_text: q.question_text,
                user_answer: userAnswer,
                correct_answer: q.correct_answer,
                is_correct: isCorrect,
                explanation: q.explanation
            });
        });

        const totalQuestions = questions.length;
        const passed = (score / totalQuestions) >= 0.6; 

        
        const insertQuery = `
            INSERT INTO quiz_attempts (user_id, lesson_id, score, total_questions, passed)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [user_id, lessonId, score, totalQuestions, passed], (err) => {
            if (err) {
                console.error('Error saving quiz attempt:', err);
            }

            
            if (passed && global.updateUserStats) {
                global.updateUserStats(user_id, 'total_quiz_passed', 1);
            }

            res.json({
                success: true,
                score: score,
                total: totalQuestions,
                percentage: Math.round((score / totalQuestions) * 100),
                passed: passed,
                results: results
            });
        });
    });
});


function updateEnrollmentProgress(userId, courseId) {
    const query = `
        UPDATE enrollments e
        SET 
            completed_lessons = (
                SELECT COUNT(*) 
                FROM lesson_progress lp 
                WHERE lp.user_id = ? AND lp.course_id = ? AND lp.is_completed = TRUE
            ),
            progress_percentage = (
                SELECT ROUND((COUNT(CASE WHEN lp.is_completed = TRUE THEN 1 END) / COUNT(l.id)) * 100, 2)
                FROM lessons l
                LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
                WHERE l.course_id = ?
            )
        WHERE e.user_id = ? AND e.course_id = ?
    `;

    db.query(query, [userId, courseId, userId, courseId, userId, courseId], (err) => {
        if (err) {
            console.error('Error updating enrollment progress:', err);
            return;
        }

        
        const checkQuery = 'SELECT progress_percentage, status FROM enrollments WHERE user_id = ? AND course_id = ?';
        db.query(checkQuery, [userId, courseId], (err, results) => {
            if (!err && results.length > 0) {
                if (results[0].progress_percentage >= 100 && results[0].status !== 'completed') {
                    db.query('UPDATE enrollments SET status = "completed" WHERE user_id = ? AND course_id = ?', [userId, courseId]);
                    if (global.updateUserStats) {
                        global.updateUserStats(userId, 'total_courses_completed', 1);
                    }
                }
            }
        });
    });
}

module.exports = router;
