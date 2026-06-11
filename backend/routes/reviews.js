const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../config/database');


router.get('/', (req, res) => {
    const courseId = req.params.courseId;
    
    const query = `
        SELECT 
            cr.id,
            cr.rating,
            cr.review_text,
            cr.created_at,
            cr.updated_at,
            u.id as user_id,
            u.full_name,
            u.avatar_url
        FROM course_reviews cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.course_id = ?
        ORDER BY cr.created_at DESC
    `;
    
    db.query(query, [courseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            reviews: results 
        });
    });
});


router.get('/user/:userId', (req, res) => {
    const courseId = req.params.courseId;
    const userId = req.params.userId;
    
    const query = `
        SELECT * FROM course_reviews 
        WHERE course_id = ? AND user_id = ?
    `;
    
    db.query(query, [courseId, userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            review: results.length > 0 ? results[0] : null 
        });
    });
});


router.post('/', (req, res) => {
    const courseId = req.params.courseId;
    const { user_id, rating, review_text } = req.body;
    
    if (!user_id || !rating) {
        return res.status(400).json({ 
            success: false, 
            message: 'User ID and rating are required' 
        });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
            success: false, 
            message: 'Rating must be between 1 and 5' 
        });
    }
    
    
    const checkQuery = 'SELECT id FROM course_reviews WHERE course_id = ? AND user_id = ?';
    
    db.query(checkQuery, [courseId, user_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }
        
        if (results.length > 0) {
            
            const updateQuery = `
                UPDATE course_reviews 
                SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP
                WHERE course_id = ? AND user_id = ?
            `;
            
            db.query(updateQuery, [rating, review_text, courseId, user_id], (err, result) => {
                if (err) {
                    console.error('Error updating review:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error updating review' 
                    });
                }
                
                updateCourseRating(courseId);
                
                res.json({ 
                    success: true, 
                    message: 'Review updated successfully',
                    action: 'updated'
                });
            });
        } else {
            
            const insertQuery = `
                INSERT INTO course_reviews (course_id, user_id, rating, review_text)
                VALUES (?, ?, ?, ?)
            `;
            
            db.query(insertQuery, [courseId, user_id, rating, review_text], (err, result) => {
                if (err) {
                    console.error('Error inserting review:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error submitting review' 
                    });
                }
                
                updateCourseRating(courseId);
                
                res.json({ 
                    success: true, 
                    message: 'Review submitted successfully',
                    action: 'created',
                    reviewId: result.insertId
                });
            });
        }
    });
});


router.delete('/:reviewId', (req, res) => {
    const courseId = req.params.courseId;
    const reviewId = req.params.reviewId;
    const { user_id } = req.body;
    
    if (!user_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'User ID is required' 
        });
    }
    
    const query = 'DELETE FROM course_reviews WHERE id = ? AND user_id = ? AND course_id = ?';
    
    db.query(query, [reviewId, user_id, courseId], (err, result) => {
        if (err) {
            console.error('Error deleting review:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting review' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found or unauthorized' 
            });
        }
        
        updateCourseRating(courseId);
        
        res.json({ 
            success: true, 
            message: 'Review deleted successfully' 
        });
    });
});


function updateCourseRating(courseId) {
    const query = `
        UPDATE courses 
        SET 
            average_rating = (
                SELECT ROUND(AVG(rating), 2)
                FROM course_reviews
                WHERE course_id = ?
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM course_reviews
                WHERE course_id = ?
            )
        WHERE id = ?
    `;
    
    db.query(query, [courseId, courseId, courseId], (err) => {
        if (err) {
            console.error('Error updating course rating:', err);
        }
    });
}

module.exports = router;
