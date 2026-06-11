const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;


const security = require('./middleware/security');


app.use(helmet());
app.use(security.securityHeaders);


app.use(cors(security.corsOptions));


app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));


app.use(security.sanitizeInput);
app.use(security.preventSQLInjection);


app.use('/api/', security.apiLimiter);


const db = require('./config/database');
const emailService = require('./emailService');


const { errorHandler, notFound } = require('./middleware/errorHandler');
const { verifyAuth } = require('./middleware/auth');


const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const lessonsRoutes = require('./routes/lessons');
const reviewsRoutes = require('./routes/reviews');
const messagesRoutes = require('./routes/messages');
const achievementsRoutes = require('./routes/achievements');
const adminRoutes = require('./routes/admin');
const recommendationsRoutes = require('./routes/recommendations');
const chatbotRoutes = require('./routes/chatbot');
const certificatesRoutes = require('./routes/certificates');
const testSeriesRoutes = require('./routes/testSeries');
const interestsRoutes = require('./routes/interests');
const notificationsRoutes = require('./routes/notifications');
const statisticsRoutes = require('./routes/statistics');


const authController = require('./controllers/authController');


global.updateUserStats = (userId, field, increment) => {
    const allowedFields = ['total_courses_completed', 'total_lessons_completed', 'total_quiz_passed', 'total_enrollments', 'total_messages_sent'];
    if (!allowedFields.includes(field)) return;
    const query = `
        INSERT INTO user_stats (user_id, ${field})
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE ${field} = ${field} + ?
    `;
    db.query(query, [userId, increment, increment], (err) => {
        if (err) console.error(`Error updating user stat [${field}]:`, err);
        else if (global.checkAchievements) global.checkAchievements(userId);
    });
};


global.updateStreak = (userId) => {
    const query = `
        INSERT INTO user_stats (user_id, current_streak, last_activity_date)
        VALUES (?, 1, CURDATE())
        ON DUPLICATE KEY UPDATE
            current_streak = CASE
                WHEN last_activity_date = CURDATE() THEN current_streak
                WHEN last_activity_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN current_streak + 1
                ELSE 1
            END,
            last_activity_date = CURDATE()
    `;
    db.query(query, [userId], (err) => {
        if (err) console.error('Error updating streak:', err);
        else if (global.checkAchievements) global.checkAchievements(userId);
    });
};

global.checkAchievements = (userId) => {
    const statsQuery = 'SELECT * FROM user_stats WHERE user_id = ?';
    db.query(statsQuery, [userId], (err, results) => {
        if (err || results.length === 0) return;
        const stats = results[0];

        const achQuery = 'SELECT * FROM achievements';
        db.query(achQuery, (err, achievements) => {
            if (err) return;

            const userAchQuery = 'SELECT achievement_id FROM user_achievements WHERE user_id = ?';
            db.query(userAchQuery, [userId], (err, userAchResults) => {
                if (err) return;
                const unlockedIds = new Set(userAchResults.map(r => r.achievement_id));

                achievements.forEach(ach => {
                    if (unlockedIds.has(ach.id)) return;

                    let meetsReq = false;
                    switch (ach.requirement_type) {
                        case 'enrollments':
                            meetsReq = stats.total_enrollments >= ach.requirement_value;
                            break;
                        case 'courses_completed':
                            meetsReq = stats.total_courses_completed >= ach.requirement_value;
                            break;
                        case 'lessons_completed':
                            meetsReq = stats.total_lessons_completed >= ach.requirement_value;
                            break;
                        case 'days_streak':
                            meetsReq = stats.current_streak >= ach.requirement_value ||
                                stats.longest_streak >= ach.requirement_value;
                            break;
                        case 'quiz_passed':
                            meetsReq = stats.total_quiz_passed >= ach.requirement_value;
                            break;
                        case 'messages_sent':
                            meetsReq = stats.total_messages_sent >= ach.requirement_value;
                            break;
                    }

                    if (meetsReq) {
                        const unlockQuery = 'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)';
                        db.query(unlockQuery, [userId, ach.id], (err) => {
                            if (!err) {
                                const pointsQuery = 'UPDATE user_stats SET total_points = total_points + ? WHERE user_id = ?';
                                db.query(pointsQuery, [ach.points, userId]);
                            }
                        });
                    }
                });
            });
        });
    });
};




app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'LearnAI Backend API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            courses: '/api/courses',
            lessons: '/api/lessons',
            reviews: '/api/courses/:courseId/reviews',
            admin: '/api/admin',
            messages: '/api/messages',
            achievements: '/api/achievements'
        }
    });
});


app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/courses/:courseId/reviews', reviewsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/test-series', testSeriesRoutes);
app.use('/api/interests', interestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/statistics', statisticsRoutes);


app.get('/api/users/all/:currentUserId', (req, res) => {
    const currentUserId = parseInt(req.params.currentUserId);
    const query = `
        SELECT id, full_name, username, avatar_url 
        FROM users 
        WHERE id != ?
        ORDER BY full_name ASC
    `;
    db.query(query, [currentUserId], (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ success: false, message: 'Error fetching users' });
        }
        res.json({ success: true, users: results });
    });
});




app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT id, full_name, username, email, phone, created_at, last_login FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: results[0] });
    });
});




app.get('/api/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT id, full_name, username, email, phone, avatar_url, 
               date_of_birth, gender, bio, college, degree, branch, 
               specialization, year_of_study, graduation_year,
               linkedin_url, github_url, twitter_url, website_url, cover_url,
               created_at, last_login
        FROM users WHERE id = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = results[0];
        
        const skillsQuery = 'SELECT skill_name FROM user_skills WHERE user_id = ?';
        db.query(skillsQuery, [userId], (err, skillsResults) => {
            user.skills = skillsResults ? skillsResults.map(s => s.skill_name) : [];
            res.json({ success: true, profile: user });
        });
    });
});


app.put('/api/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    const updateData = req.body;
    const allowedFields = [
        'full_name', 'phone', 'date_of_birth', 'gender', 'bio',
        'college', 'degree', 'branch', 'specialization', 'year_of_study', 'graduation_year',
        'linkedin_url', 'github_url', 'twitter_url', 'website_url', 'email'
    ];
    const updates = [];
    const values = [];
    allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
            updates.push(`${field} = ?`);
            values.push(updateData[field]);
        }
    });
    if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).json({ success: false, message: 'Error updating profile' });
        }
        res.json({ success: true, message: 'Profile updated successfully' });
    });
});


app.put('/api/profile/:userId/avatar', (req, res) => {
    const userId = req.params.userId;
    const { avatar_url } = req.body;
    if (!avatar_url) {
        return res.status(400).json({ success: false, message: 'Avatar URL is required' });
    }
    // Accept both base64 data URLs and regular URLs
    const isBase64 = avatar_url.startsWith('data:image/');
    const isUrl    = avatar_url.startsWith('http://') || avatar_url.startsWith('https://');
    if (!isBase64 && !isUrl) {
        return res.status(400).json({ success: false, message: 'Invalid image format' });
    }
    const query = 'UPDATE users SET avatar_url = ? WHERE id = ?';
    db.query(query, [avatar_url, userId], (err, result) => {
        if (err) {
            console.error('Error updating avatar:', err);
            return res.status(500).json({ success: false, message: 'Error updating avatar' });
        }
        res.json({ success: true, message: 'Avatar updated successfully' });
    });
});

app.put('/api/profile/:userId/cover', (req, res) => {
    const userId = req.params.userId;
    const { cover_url } = req.body;
    if (!cover_url) return res.status(400).json({ success: false, message: 'Cover URL is required' });
    const isBase64 = cover_url.startsWith('data:image/');
    const isUrl    = cover_url.startsWith('http://') || cover_url.startsWith('https://');
    if (!isBase64 && !isUrl) {
        return res.status(400).json({ success: false, message: 'Invalid image format' });
    }
    db.query('UPDATE users SET cover_url = ? WHERE id = ?', [cover_url, userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error updating cover' });
        res.json({ success: true, message: 'Cover updated successfully' });
    });
});


app.post('/api/profile/:userId/skills', (req, res) => {
    const userId = req.params.userId;
    const { skill_name } = req.body;
    if (!skill_name) {
        return res.status(400).json({ success: false, message: 'Skill name is required' });
    }
    const query = 'INSERT INTO user_skills (user_id, skill_name) VALUES (?, ?)';
    db.query(query, [userId, skill_name], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Skill already exists' });
            }
            console.error('Error adding skill:', err);
            return res.status(500).json({ success: false, message: 'Error adding skill' });
        }
        res.json({ success: true, message: 'Skill added successfully' });
    });
});


app.delete('/api/profile/:userId/skills/:skillName', (req, res) => {
    const userId = req.params.userId;
    const skillName = req.params.skillName;
    const query = 'DELETE FROM user_skills WHERE user_id = ? AND skill_name = ?';
    db.query(query, [userId, skillName], (err, result) => {
        if (err) {
            console.error('Error deleting skill:', err);
            return res.status(500).json({ success: false, message: 'Error deleting skill' });
        }
        res.json({ success: true, message: 'Skill deleted successfully' });
    });
});


app.put('/api/profile/:userId/password', async (req, res) => {
    const userId = req.params.userId;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
        return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (new_password.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }
    const getUserQuery = 'SELECT password FROM users WHERE id = ?';
    db.query(getUserQuery, [userId], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: 'Error verifying user' });
        }
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(current_password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        const hashedPassword = await bcrypt.hash(new_password, 10);
        const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
        db.query(updateQuery, [hashedPassword, userId], (err, result) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.status(500).json({ success: false, message: 'Error updating password' });
            }
            res.json({ success: true, message: 'Password updated successfully' });
        });
    });
});


app.delete('/api/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
        return res.status(400).json({ success: false, message: 'Invalid confirmation' });
    }
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting account:', err);
            return res.status(500).json({ success: false, message: 'Error deleting account' });
        }
        res.json({ success: true, message: 'Account deleted successfully' });
    });
});


app.use(notFound);
app.use(errorHandler);


app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   LearnAI Backend Server Started       ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
║   Database: ${process.env.DB_NAME || 'learnai_db'}                 ║
╚════════════════════════════════════════╝
    `);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/`);
});


process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    db.end();
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
