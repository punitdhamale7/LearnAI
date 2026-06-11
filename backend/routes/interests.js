const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all interest categories
router.get('/categories', (req, res) => {
    const query = 'SELECT * FROM interest_categories ORDER BY name ASC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching interest categories:', err);
            return res.status(500).json({ success: false, message: 'Error fetching categories' });
        }
        
        res.json({ success: true, categories: results });
    });
});

// Get user's interests
router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = 'SELECT * FROM user_interests WHERE user_id = ? ORDER BY created_at DESC';
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user interests:', err);
            return res.status(500).json({ success: false, message: 'Error fetching interests' });
        }
        
        res.json({ success: true, interests: results });
    });
});

// Save user interests (bulk)
router.post('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const { interestIds, interests } = req.body; // Accept both interestIds and interests
    const interestArray = interestIds || interests; // Use whichever is provided
    
    if (!interestArray || !Array.isArray(interestArray) || interestArray.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide at least one interest' });
    }
    
    // Delete existing interests first
    const deleteQuery = 'DELETE FROM user_interests WHERE user_id = ?';
    
    db.query(deleteQuery, [userId], (err) => {
        if (err) {
            console.error('Error deleting old interests:', err);
            return res.status(500).json({ success: false, message: 'Error updating interests' });
        }
        
        // Insert new interests
        const values = interestArray.map(interest => [userId, interest]);
        const insertQuery = 'INSERT INTO user_interests (user_id, interest_name) VALUES ?';
        
        db.query(insertQuery, [values], (err, result) => {
            if (err) {
                console.error('Error inserting interests:', err);
                return res.status(500).json({ success: false, message: 'Error saving interests' });
            }
            
            res.json({ 
                success: true, 
                message: 'Interests saved successfully',
                count: result.affectedRows 
            });
        });
    });
});

// Get interest-based course recommendations
router.get('/recommendations/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Get user's interests
    const interestsQuery = 'SELECT interest_name FROM user_interests WHERE user_id = ?';
    
    db.query(interestsQuery, [userId], (err, interests) => {
        if (err || interests.length === 0) {
            return res.json({ success: true, recommendations: [], message: 'No interests set' });
        }
        
        // Build search conditions for each interest
        const interestNames = interests.map(i => i.interest_name);
        const searchConditions = interestNames.map(() => 
            '(LOWER(c.title) LIKE ? OR LOWER(c.description) LIKE ?)'
        ).join(' OR ');
        
        const searchParams = interestNames.flatMap(name => [
            `%${name.toLowerCase()}%`,
            `%${name.toLowerCase()}%`
        ]);
        
        // Get courses matching interests
        const coursesQuery = `
            SELECT DISTINCT
                c.*,
                COALESCE(AVG(cr.rating), 0) as average_rating,
                COUNT(DISTINCT cr.id) as total_reviews,
                COUNT(DISTINCT e.id) as total_students
            FROM courses c
            LEFT JOIN course_reviews cr ON c.id = cr.course_id
            LEFT JOIN enrollments e ON c.id = e.course_id
            WHERE (${searchConditions})
            AND c.id NOT IN (SELECT COALESCE(course_id, 0) FROM enrollments WHERE user_id = ?)
            GROUP BY c.id
            ORDER BY c.rating DESC, c.total_students DESC
            LIMIT 12
        `;
        
        db.query(coursesQuery, [...searchParams, userId], (err, courses) => {
            if (err) {
                console.error('Error fetching interest-based courses:', err);
                return res.status(500).json({ success: false, message: 'Error fetching recommendations' });
            }
            
            // Add recommendation metadata
            const recommendations = courses.map(course => ({
                ...course,
                recommendation_reason: `Matches your interest in ${interestNames.slice(0, 2).join(' and ')}`,
                match_percentage: 90,
                confidence: 'very high'
            }));
            
            res.json({ 
                success: true, 
                recommendations: recommendations,
                interests: interestNames
            });
        });
    });
});

module.exports = router;
