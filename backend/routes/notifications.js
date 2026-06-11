const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all notifications for a user
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const { limit = 50, unreadOnly = 'false' } = req.query;
    
    let query = `
        SELECT * FROM notifications 
        WHERE user_id = ?
    `;
    
    if (unreadOnly === 'true') {
        query += ' AND is_read = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    
    db.query(query, [userId, parseInt(limit)], (err, results) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ success: false, message: 'Error fetching notifications' });
        }
        
        res.json({ success: true, notifications: results });
    });
});

// Get unread notification count
router.get('/:userId/count', (req, res) => {
    const userId = req.params.userId;
    
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error counting notifications:', err);
            return res.status(500).json({ success: false, message: 'Error counting notifications' });
        }
        
        res.json({ success: true, count: results[0].count });
    });
});

// Mark notification as read
router.put('/:notificationId/read', (req, res) => {
    const notificationId = req.params.notificationId;
    
    const query = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?';
    
    db.query(query, [notificationId], (err, result) => {
        if (err) {
            console.error('Error marking notification as read:', err);
            return res.status(500).json({ success: false, message: 'Error updating notification' });
        }
        
        res.json({ success: true, message: 'Notification marked as read' });
    });
});

// Mark all notifications as read for a user
router.put('/:userId/read-all', (req, res) => {
    const userId = req.params.userId;
    
    const query = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE';
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error marking all notifications as read:', err);
            return res.status(500).json({ success: false, message: 'Error updating notifications' });
        }
        
        res.json({ success: true, message: 'All notifications marked as read', updated: result.affectedRows });
    });
});

// Delete a notification
router.delete('/:notificationId', (req, res) => {
    const notificationId = req.params.notificationId;
    
    const query = 'DELETE FROM notifications WHERE id = ?';
    
    db.query(query, [notificationId], (err, result) => {
        if (err) {
            console.error('Error deleting notification:', err);
            return res.status(500).json({ success: false, message: 'Error deleting notification' });
        }
        
        res.json({ success: true, message: 'Notification deleted' });
    });
});

// Delete all read notifications for a user
router.delete('/:userId/clear-read', (req, res) => {
    const userId = req.params.userId;
    
    const query = 'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE';
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error clearing notifications:', err);
            return res.status(500).json({ success: false, message: 'Error clearing notifications' });
        }
        
        res.json({ success: true, message: 'Read notifications cleared', deleted: result.affectedRows });
    });
});

// Create a new notification (for system use)
router.post('/', (req, res) => {
    const { user_id, type, title, message, link } = req.body;
    
    if (!user_id || !type || !title || !message) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const query = 'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [user_id, type, title, message, link || null], (err, result) => {
        if (err) {
            console.error('Error creating notification:', err);
            return res.status(500).json({ success: false, message: 'Error creating notification' });
        }
        
        res.json({ success: true, message: 'Notification created', notificationId: result.insertId });
    });
});

// Helper function to create notification (can be called from other routes)
function createNotification(userId, type, title, message, link = null) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)';
        
        db.query(query, [userId, type, title, message, link], (err, result) => {
            if (err) {
                console.error('Error creating notification:', err);
                reject(err);
            } else {
                resolve(result.insertId);
            }
        });
    });
}

// Export helper function for use in other routes
router.createNotification = createNotification;

module.exports = router;
