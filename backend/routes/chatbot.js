const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Groq = require('groq-sdk');


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';


const SYSTEM_PROMPT = `You are an intelligent AI learning assistant for LearnAI, an AI-powered adaptive learning platform.

About LearnAI Platform:
- An online learning platform with courses in Web Development, Python/Data Science, AI & Machine Learning, and Mobile App Development
- Features: Course enrollment, progress tracking, achievements/badges, certificates, AI recommendations, messaging
- Users can earn certificates upon 100% course completion
- Courses have difficulty levels: Beginner, Intermediate, Advanced
- Platform has a dashboard, my-courses, browse-courses, progress, achievements, profile, settings pages

Your personality:
- Friendly, encouraging, and supportive like a personal tutor
- Keep responses concise and clear (max 3-4 sentences for simple questions)
- Use emojis occasionally to make responses feel warm
- For technical questions, give clear step-by-step explanations
- Always encourage the user to keep learning

Your capabilities:
- Answer questions about courses, programming, technology, career advice
- Help users navigate the platform
- Explain technical concepts in simple terms
- Motivate and guide learners
- Suggest relevant courses based on interests

Important rules:
- Never make up course prices or specific data — say "check the platform for latest details"
- If asked about something unrelated to learning/tech, politely redirect to learning topics
- Keep responses helpful and to the point`;


router.post('/chat', async (req, res) => {
    const { message, userId, history = [] } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    try {
        
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        
        const recentHistory = history.slice(-6);
        recentHistory.forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });

        
        messages.push({ role: 'user', content: message.trim() });

        
        const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 512,
            stream: false
        });

        const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

        
        const suggestions = generateSuggestions(message.toLowerCase());

        
        if (userId) {
            logConversation(userId, message, reply);
        }

        res.json({
            success: true,
            reply,
            suggestions,
            model: GROQ_MODEL
        });

    } catch (error) {
        console.error('Groq API error:', error?.message || error);

        
        const fallback = getFallbackResponse(message);
        res.json({
            success: true,
            reply: fallback.reply,
            suggestions: fallback.suggestions,
            model: 'fallback'
        });
    }
});


router.get('/history/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`;

    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching history' });
        res.json({ success: true, history: results || [] });
    });
});


function generateSuggestions(message) {
    if (message.includes('course') || message.includes('learn') || message.includes('enroll')) {
        return ['Browse courses', 'My courses', 'Get recommendations', 'Check progress'];
    }
    if (message.includes('progress') || message.includes('complete')) {
        return ['View progress', 'My achievements', 'Continue learning', 'Download certificate'];
    }
    if (message.includes('python') || message.includes('web') || message.includes('ai') || message.includes('mobile')) {
        return ['Enroll now', 'Browse all courses', 'View curriculum', 'Check pricing'];
    }
    if (message.includes('help') || message.includes('how')) {
        return ['Browse courses', 'View dashboard', 'Check achievements', 'Contact support'];
    }
    if (message.includes('certificate') || message.includes('badge')) {
        return ['My courses', 'View achievements', 'Check progress', 'Browse courses'];
    }
    return ['Browse courses', 'My progress', 'Recommendations', 'Help'];
}


function getFallbackResponse(message) {
    const lower = message.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi')) {
        return {
            reply: "Hello! 👋 I'm your AI learning assistant. I'm having a small connection issue right now, but I'm here to help! What would you like to learn today?",
            suggestions: ['Browse courses', 'My progress', 'Recommendations', 'Help']
        };
    }
    if (lower.includes('course')) {
        return {
            reply: "We have great courses in Web Development, Python & Data Science, AI & Machine Learning, and Mobile App Development! 🎓 Head to Browse Courses to explore them.",
            suggestions: ['Browse courses', 'Enroll now', 'View pricing', 'My courses']
        };
    }
    return {
        reply: "I'm having trouble connecting to my AI brain right now 🤔 Please try again in a moment, or browse our courses while you wait!",
        suggestions: ['Browse courses', 'My progress', 'Dashboard', 'Help']
    };
}


function logConversation(userId, userMessage, botReply) {
    const query = `
        INSERT INTO chat_history (user_id, user_message, bot_reply, created_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE created_at = NOW()
    `;
    db.query(query, [userId, userMessage, botReply], (err) => {
        if (err) console.error('Error logging conversation:', err.message);
    });
}

module.exports = router;
