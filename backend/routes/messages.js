const express = require('express');
const router = express.Router();
const db = require('../config/database');


router.get('/conversations/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);

    const query = `
        SELECT 
            c.id as conversation_id,
            CASE 
                WHEN c.user1_id = ? THEN c.user2_id 
                ELSE c.user1_id 
            END as other_user_id,
            CASE 
                WHEN c.user1_id = ? THEN u2.full_name 
                ELSE u1.full_name 
            END as other_user_name,
            CASE 
                WHEN c.user1_id = ? THEN u2.avatar_url 
                ELSE u1.avatar_url 
            END as other_user_avatar,
            (SELECT message_text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = ? AND is_read = FALSE) as unread_count
        FROM conversations c
        LEFT JOIN users u1 ON c.user1_id = u1.id
        LEFT JOIN users u2 ON c.user2_id = u2.id
        WHERE c.user1_id = ? OR c.user2_id = ?
        ORDER BY last_message_time DESC
    `;

    db.query(query, [userId, userId, userId, userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching conversations:', err);
            return res.status(500).json({ success: false, message: 'Error fetching conversations' });
        }
        res.json({ success: true, conversations: results });
    });
});


router.get('/conversation/:conversationId', (req, res) => {
    const conversationId = parseInt(req.params.conversationId);

    const query = `
        SELECT 
            m.*,
            u.full_name as sender_name,
            u.avatar_url as sender_avatar
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
    `;

    db.query(query, [conversationId], (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ success: false, message: 'Error fetching messages' });
        }
        res.json({ success: true, messages: results });
    });
});


router.post('/send', (req, res) => {
    const { sender_id, receiver_id, message_text } = req.body;

    if (!sender_id || !receiver_id || !message_text) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    
    const findConversationQuery = `
        SELECT id FROM conversations 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `;

    db.query(findConversationQuery, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
        if (err) {
            console.error('Error finding conversation:', err);
            return res.status(500).json({ success: false, message: 'Error finding conversation' });
        }

        if (results.length > 0) {
            
            const conversationId = results[0].id;
            insertMessage(conversationId, sender_id, receiver_id, message_text, res);
        } else {
            
            const createConversationQuery = 'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)';
            db.query(createConversationQuery, [sender_id, receiver_id], (err, result) => {
                if (err) {
                    console.error('Error creating conversation:', err);
                    return res.status(500).json({ success: false, message: 'Error creating conversation' });
                }
                const conversationId = result.insertId;
                insertMessage(conversationId, sender_id, receiver_id, message_text, res);
            });
        }
    });
});

function insertMessage(conversationId, senderId, receiverId, messageText, res) {
    const insertMessageQuery = `
        INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(insertMessageQuery, [conversationId, senderId, receiverId, messageText], (err, result) => {
        if (err) {
            console.error('Error inserting message:', err);
            return res.status(500).json({ success: false, message: 'Error sending message' });
        }

        
        if (global.updateUserStats) {
            global.updateUserStats(senderId, 'total_messages_sent', 1);
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            conversation_id: conversationId,
            message_id: result.insertId
        });
    });
}


router.put('/mark-read/:conversationId/:userId', (req, res) => {
    const { conversationId, userId } = req.params;

    const query = `
        UPDATE messages 
        SET is_read = TRUE 
        WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE
    `;

    db.query(query, [conversationId, userId], (err, result) => {
        if (err) {
            console.error('Error marking messages as read:', err);
            return res.status(500).json({ success: false, message: 'Error marking messages as read' });
        }
        res.json({ success: true, message: 'Messages marked as read' });
    });
});

module.exports = router;
