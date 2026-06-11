const express = require('express');
const router = express.Router();
const db = require('../config/database');
const emailService = require('../emailService');


router.get('/search', (req, res) => {
    const { q, category, level, minPrice, maxPrice } = req.query;
    
    let query = `
        SELECT 
            c.id, 
            c.title, 
            c.description, 
            c.instructor_name, 
            c.difficulty_level, 
            c.price, 
            c.duration_hours, 
            c.total_lessons, 
            c.rating,
            COUNT(DISTINCT e.id) as total_students,
            COALESCE(AVG(cr.rating), 0) as average_rating,
            COUNT(DISTINCT cr.id) as total_reviews
        FROM courses c
        LEFT JOIN course_reviews cr ON c.id = cr.course_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE 1=1
    `;
    
    const params = [];
    
    
    if (q) {
        query += ` AND (c.title LIKE ? OR c.description LIKE ? OR c.instructor_name LIKE ?)`;
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    
    if (level && level !== 'all') {
        query += ` AND c.difficulty_level = ?`;
        params.push(level);
    }
    
    
    if (minPrice) {
        query += ` AND c.price >= ?`;
        params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
        query += ` AND c.price <= ?`;
        params.push(parseFloat(maxPrice));
    }
    
    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            courses: results,
            count: results.length
        });
    });
});


router.get('/', (req, res) => {
    const query = `
        SELECT 
            c.id, 
            c.title, 
            c.description, 
            c.instructor_name, 
            c.difficulty_level, 
            c.price, 
            c.duration_hours, 
            c.total_lessons, 
            c.rating,
            COUNT(DISTINCT e.id) as total_students,
            COALESCE(AVG(cr.rating), 0) as average_rating,
            COUNT(DISTINCT cr.id) as total_reviews
        FROM courses c
        LEFT JOIN course_reviews cr ON c.id = cr.course_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            courses: results 
        });
    });
});


router.get('/:courseId', (req, res) => {
    const courseId = req.params.courseId;
    
    const query = `
        SELECT 
            c.id, 
            c.title, 
            c.description, 
            c.instructor_name, 
            c.difficulty_level, 
            c.price, 
            c.duration_hours, 
            c.total_lessons, 
            c.rating,
            COUNT(DISTINCT e.id) as total_students,
            c.created_at, 
            c.updated_at
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.id = ?
        GROUP BY c.id
    `;
    
    db.query(query, [courseId], (err, results) => {
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
                message: 'Course not found' 
            });
        }

        res.json({ 
            success: true, 
            course: results[0] 
        });
    });
});


router.get('/:courseId/curriculum', (req, res) => {
    const courseId = req.params.courseId;
    
    const query = `
        SELECT 
            cs.id as section_id,
            cs.title as section_title,
            cs.description as section_description,
            cs.order_index as section_order,
            l.id as lesson_id,
            l.title as lesson_title,
            l.description as lesson_description,
            l.content_type,
            l.duration_minutes,
            l.order_index as lesson_order,
            l.is_free
        FROM course_sections cs
        LEFT JOIN lessons l ON cs.id = l.section_id
        WHERE cs.course_id = ?
        ORDER BY cs.order_index, l.order_index
    `;
    
    db.query(query, [courseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        
        const sections = {};
        results.forEach(row => {
            if (!sections[row.section_id]) {
                sections[row.section_id] = {
                    id: row.section_id,
                    title: row.section_title,
                    description: row.section_description,
                    order: row.section_order,
                    lessons: []
                };
            }
            
            if (row.lesson_id) {
                sections[row.section_id].lessons.push({
                    id: row.lesson_id,
                    title: row.lesson_title,
                    description: row.lesson_description,
                    content_type: row.content_type,
                    duration_minutes: row.duration_minutes,
                    order: row.lesson_order,
                    is_free: row.is_free
                });
            }
        });

        const curriculum = Object.values(sections);

        res.json({ 
            success: true, 
            curriculum: curriculum 
        });
    });
});


router.get('/:courseId/progress/:userId', (req, res) => {
    const { courseId, userId } = req.params;
    
    const query = `
        SELECT 
            COUNT(l.id) as total_lessons,
            COUNT(lp.id) as started_lessons,
            SUM(CASE WHEN lp.is_completed = TRUE THEN 1 ELSE 0 END) as completed_lessons,
            ROUND((SUM(CASE WHEN lp.is_completed = TRUE THEN 1 ELSE 0 END) / COUNT(l.id)) * 100, 2) as progress_percentage
        FROM lessons l
        LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
        WHERE l.course_id = ?
    `;
    
    db.query(query, [userId, courseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            progress: results[0] 
        });
    });
});


router.post('/enroll', (req, res) => {
    const { user_id, course_id } = req.body;
    
    if (!user_id || !course_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'User ID and Course ID are required' 
        });
    }
    
    
    const checkQuery = 'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?';
    db.query(checkQuery, [user_id, course_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already enrolled in this course' 
            });
        }
        
        
        const enrollQuery = 'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)';
        db.query(enrollQuery, [user_id, course_id], (err, result) => {
            if (err) {
                console.error('Error enrolling:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error enrolling in course' 
                });
            }
            
            
            if (global.updateUserStats) {
                global.updateUserStats(user_id, 'total_enrollments', 1);
            }
            
            
            const getUserQuery = 'SELECT full_name, email FROM users WHERE id = ?';
            const getCourseQuery = 'SELECT title FROM courses WHERE id = ?';
            
            db.query(getUserQuery, [user_id], (err, userResults) => {
                if (!err && userResults.length > 0) {
                    db.query(getCourseQuery, [course_id], (err, courseResults) => {
                        if (!err && courseResults.length > 0) {
                            const user = userResults[0];
                            const course = courseResults[0];
                            
                            
                            emailService.sendEnrollmentEmail(user.full_name, user.email, course.title, course_id)
                                .then(() => console.log(`Enrollment email sent to ${user.email}`))
                                .catch(err => console.error('Failed to send enrollment email:', err.message));
                        }
                    });
                }
            });
            
            res.json({ 
                success: true, 
                message: 'Successfully enrolled in course',
                enrollment_id: result.insertId
            });
        });
    });
});


router.get('/enrollments/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT e.*, c.title, c.description, c.instructor_name, 
               c.difficulty_level, c.duration_hours, c.total_lessons, c.rating
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ?
        ORDER BY e.enrolled_at DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            enrollments: results 
        });
    });
});


router.get('/enrollments/:userId/:courseId', (req, res) => {
    const { userId, courseId } = req.params;
    
    const query = 'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?';
    db.query(query, [userId, courseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            enrolled: results.length > 0,
            enrollment: results.length > 0 ? results[0] : null
        });
    });
});


router.put('/enrollments/:enrollmentId', (req, res) => {
    const enrollmentId = req.params.enrollmentId;
    const { progress_percentage, completed_lessons } = req.body;
    
    const query = `
        UPDATE enrollments 
        SET progress_percentage = ?, completed_lessons = ?, last_accessed = NOW()
        WHERE id = ?
    `;
    
    db.query(query, [progress_percentage, completed_lessons, enrollmentId], (err, result) => {
        if (err) {
            console.error('Error updating progress:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error updating progress' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Progress updated successfully' 
        });
    });
});

module.exports = router;
