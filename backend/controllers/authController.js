const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const emailService = require('../emailService');
const { generateToken, generateRefreshToken } = require('../utils/jwt');


exports.register = async (req, res) => {
    try {
        const { fullName, username, email, phone, password } = req.body;

        
        const checkUserQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
        db.query(checkUserQuery, [email, username], async (err, results) => {
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
                    message: 'User with this email or username already exists'
                });
            }

            
            const hashedPassword = await bcrypt.hash(password, 10);

            
            const insertQuery = `
                INSERT INTO users (full_name, username, email, phone, password, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            db.query(insertQuery, [fullName, username, email, phone || null, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating user account'
                    });
                }

                
                emailService.sendWelcomeEmail(fullName, email)
                    .then(() => console.log(`Welcome email sent to ${email}`))
                    .catch(err => console.error('Failed to send welcome email:', err.message));

                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    userId: result.insertId
                });
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};


exports.login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        
        const query = 'SELECT * FROM users WHERE email = ? OR username = ?';
        db.query(query, [emailOrUsername, emailOrUsername], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email/username or password'
                });
            }

            const user = results[0];

            
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email/username or password'
                });
            }

            
            const updateLoginQuery = 'UPDATE users SET last_login = NOW() WHERE id = ?';
            db.query(updateLoginQuery, [user.id]);

            
            const accessToken = generateToken(user.id, user.email, user.role || 'user');
            const refreshToken = generateRefreshToken(user.id);

            
            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role || 'user'
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};


exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    
    const userQuery = 'SELECT id, full_name, email FROM users WHERE email = ?';
    db.query(userQuery, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        }

        const user = results[0];

        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); 

        
        const insertTokenQuery = `
            INSERT INTO password_reset_tokens (user_id, token, expires_at) 
            VALUES (?, ?, ?)
        `;

        db.query(insertTokenQuery, [user.id, resetToken, expiresAt], (err) => {
            if (err) {
                console.error('Error saving reset token:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error generating reset token'
                });
            }

            
            emailService.sendPasswordResetEmail(user.full_name, user.email, resetToken)
                .then(() => {
                    res.json({
                        success: true,
                        message: 'Password reset link has been sent to your email'
                    });
                })
                .catch(err => {
                    console.error('Failed to send reset email:', err.message);
                    res.status(500).json({
                        success: false,
                        message: 'Error sending reset email'
                    });
                });
        });
    });
};


exports.verifyResetToken = (req, res) => {
    const { token } = req.params;

    const query = `
        SELECT prt.*, u.email, u.full_name 
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()
    `;

    db.query(query, [token], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            email: results[0].email
        });
    });
};


exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Token and new password are required'
        });
    }

    
    const tokenQuery = `
        SELECT user_id 
        FROM password_reset_tokens 
        WHERE token = ? AND used = FALSE AND expires_at > NOW()
    `;

    db.query(tokenQuery, [token], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        const userId = results[0].user_id;

        try {
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            
            const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?';
            db.query(updatePasswordQuery, [hashedPassword, userId], (err) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating password'
                    });
                }

                
                const markUsedQuery = 'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?';
                db.query(markUsedQuery, [token]);

                res.json({
                    success: true,
                    message: 'Password reset successfully'
                });
            });
        } catch (error) {
            console.error('Error hashing password:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    });
};


exports.adminLogin = (req, res) => {
    const { email, password } = req.body;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('Admin credentials not configured in .env');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        
        const accessToken = generateToken(0, ADMIN_EMAIL, 'admin');
        const refreshToken = generateRefreshToken(0);

        return res.json({
            success: true,
            message: 'Admin login successful',
            admin: {
                id: 0,
                email: ADMIN_EMAIL,
                name: 'Admin',
                role: 'admin'
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });
    }

    res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
    });
};


exports.refreshToken = (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token required'
        });
    }

    try {
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        
        const userQuery = 'SELECT id, email, role FROM users WHERE id = ?';
        db.query(userQuery, [decoded.userId], (err, results) => {
            if (err || results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = results[0];
            
            
            const newAccessToken = generateToken(user.id, user.email, user.role || 'user');

            res.json({
                success: true,
                accessToken: newAccessToken
            });
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};


exports.logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
};
