const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get platform statistics
router.get('/', (req, res) => {
    // Query to get all statistics in parallel
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        totalCourses: 'SELECT COUNT(*) as count FROM courses',
        totalEnrollments: 'SELECT COUNT(*) as count FROM enrollments',
        totalInstructors: 'SELECT COUNT(DISTINCT instructor_name) as count FROM courses',
        completedCourses: 'SELECT COUNT(*) as count FROM enrollments WHERE progress_percentage = 100',
        averageProgress: 'SELECT AVG(progress_percentage) as avg FROM enrollments'
    };

    // Execute all queries
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(queries.totalUsers, (err, results) => {
                if (err) reject(err);
                else resolve({ totalUsers: results[0].count });
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.totalCourses, (err, results) => {
                if (err) reject(err);
                else resolve({ totalCourses: results[0].count });
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.totalEnrollments, (err, results) => {
                if (err) reject(err);
                else resolve({ totalEnrollments: results[0].count });
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.totalInstructors, (err, results) => {
                if (err) reject(err);
                else resolve({ totalInstructors: results[0].count });
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.completedCourses, (err, results) => {
                if (err) reject(err);
                else resolve({ completedCourses: results[0].count });
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.averageProgress, (err, results) => {
                if (err) reject(err);
                else resolve({ averageProgress: results[0].avg || 0 });
            });
        })
    ])
    .then(results => {
        // Combine all results
        const stats = Object.assign({}, ...results);
        
        // Calculate success rate (percentage of completed courses)
        const successRate = stats.totalEnrollments > 0 
            ? Math.round((stats.completedCourses / stats.totalEnrollments) * 100)
            : 0;
        
        res.json({
            success: true,
            statistics: {
                activeStudents: stats.totalUsers,
                coursesAvailable: stats.totalCourses,
                successRate: successRate,
                expertInstructors: stats.totalInstructors,
                totalEnrollments: stats.totalEnrollments,
                completedCourses: stats.completedCourses,
                averageProgress: Math.round(stats.averageProgress)
            }
        });
    })
    .catch(error => {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    });
});

module.exports = router;
