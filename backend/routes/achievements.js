const express = require('express');
const router = express.Router();
const db = require('../config/database');




router.get('/stats/:userId', (req, res) => {
    const userId = req.params.userId;

    const achievementsQuery = `
        SELECT 
            COUNT(*) as total_achievements_unlocked,
            COALESCE(SUM(a.points), 0) as total_points,
            (SELECT COUNT(*) FROM achievements) as total_achievements
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ?
    `;

    
    const statsQuery = `
        SELECT 
            us.total_courses_completed,
            us.total_lessons_completed,
            us.current_streak as current_streak_days,
            us.longest_streak as longest_streak_days,
            (SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND status = 'completed') as real_courses_completed,
            (SELECT COUNT(*) FROM lesson_progress WHERE user_id = ? AND is_completed = TRUE) as real_lessons_completed,
            (SELECT COUNT(*) FROM enrollments WHERE user_id = ?) as real_enrollments
        FROM user_stats us
        WHERE us.user_id = ?
    `;

    db.query(achievementsQuery, [userId], (err, achResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        db.query(statsQuery, [userId, userId, userId, userId], (err, statsResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            const achData = achResults[0] || {};
            const s = statsResults[0] || {};

            
            const coursesCompleted = Math.max(s.total_courses_completed || 0, s.real_courses_completed || 0);
            const lessonsCompleted = Math.max(s.total_lessons_completed || 0, s.real_lessons_completed || 0);

            res.json({
                success: true,
                stats: {
                    total_achievements_unlocked: achData.total_achievements_unlocked || 0,
                    total_achievements: achData.total_achievements || 0,
                    total_points: achData.total_points || 0,
                    total_courses_completed: coursesCompleted,
                    total_lessons_completed: lessonsCompleted,
                    total_enrollments: s.real_enrollments || 0,
                    current_streak_days: s.current_streak_days || 0,
                    longest_streak_days: s.longest_streak_days || 0
                }
            });
        });
    });
});


router.get('/:userId/unnotified', (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT 
            ua.id,
            ua.achievement_id,
            ua.unlocked_at as earned_at,
            a.name,
            a.description,
            a.icon,
            a.points
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ? AND ua.is_notified = FALSE
        ORDER BY ua.unlocked_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, achievements: results });
    });
});


router.put('/:userId/mark-notified', (req, res) => {
    const userId = req.params.userId;
    const { achievement_ids } = req.body;

    if (!achievement_ids || achievement_ids.length === 0) {
        return res.json({ success: true, message: 'No achievements to mark' });
    }

    const query = `
        UPDATE user_achievements 
        SET is_notified = TRUE 
        WHERE user_id = ? AND id IN (?)
    `;

    db.query(query, [userId, achievement_ids], (err) => {
        if (err) {
            console.error('Error marking achievements:', err);
            return res.status(500).json({ success: false, message: 'Error marking achievements' });
        }
        res.json({ success: true, message: 'Achievements marked as notified' });
    });
});


router.get('/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT 
            a.id,
            a.name,
            a.description,
            a.icon,
            a.category,
            a.points,
            a.rarity,
            a.requirement_type,
            a.requirement_value,
            CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
            ua.unlocked_at
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
        ORDER BY a.category, a.requirement_value ASC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, achievements: results });
    });
});

module.exports = router;
