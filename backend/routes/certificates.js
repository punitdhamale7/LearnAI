const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { generateCertificate } = require('../utils/certificateGenerator');


router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT COUNT(*) as count
        FROM enrollments
        WHERE user_id = ? AND progress_percentage >= 100
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, count: results[0].count });
    });
});


router.get('/generate/:userId/:courseId', (req, res) => {
    const { userId, courseId } = req.params;

    
    const checkQuery = `
        SELECT 
            e.progress_percentage,
            u.id as user_id,
            u.full_name,
            u.email,
            c.id as course_id,
            c.title,
            c.instructor_name,
            e.enrolled_at
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ? AND e.course_id = ?
    `;

    db.query(checkQuery, [userId, courseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Error checking course completion'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        const enrollment = results[0];

        if (enrollment.progress_percentage < 100) {
            return res.status(400).json({
                success: false,
                message: 'Course not completed yet',
                progress: enrollment.progress_percentage
            });
        }

        
        const userData = {
            id: enrollment.user_id,
            fullName: enrollment.full_name,
            email: enrollment.email
        };

        const courseData = {
            id: enrollment.course_id,
            title: enrollment.title,
            instructor_name: enrollment.instructor_name
        };

        generateCertificate(userData, courseData, (error, pdfBuffer) => {
            if (error) {
                console.error('Error generating certificate:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error generating certificate'
                });
            }

            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Certificate-${courseData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);

            
            res.send(pdfBuffer);
        });
    });
});


router.get('/info/:userId/:courseId', (req, res) => {
    const { userId, courseId } = req.params;

    const query = `
        SELECT 
            e.progress_percentage,
            e.enrolled_at,
            c.title,
            c.instructor_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ? AND e.course_id = ?
    `;

    db.query(query, [userId, courseId], (err, results) => {
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
                message: 'Enrollment not found'
            });
        }

        const enrollment = results[0];

        res.json({
            success: true,
            certificate: {
                available: enrollment.progress_percentage === 100,
                progress: enrollment.progress_percentage,
                enrolledAt: enrollment.enrolled_at,
                courseTitle: enrollment.title,
                instructor: enrollment.instructor_name
            }
        });
    });
});

module.exports = router;
