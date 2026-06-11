const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');


const apiLimiter = process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 100, 
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false
    })
    : (req, res, next) => next();


const loginLimiter = process.env.NODE_ENV === 'production' 
    ? rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 20, 
        message: {
            success: false,
            message: 'Too many login attempts, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true 
    })
    : (req, res, next) => next();


const registerLimiter = process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 60 * 60 * 1000, 
        max: 10, 
        message: {
            success: false,
            message: 'Too many registration attempts, please try again after 1 hour'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true 
    })
    : (req, res, next) => next();


const sanitizeInput = (req, res, next) => {
    
    // Skip these fields entirely — passwords, tokens, and binary/base64 data
    const skipFields = [
        'password', 'newPassword', 'current_password', 'confirmPassword',
        'token', 'refreshToken',
        'avatar_url', 'cover_url', 'article_content', 'bio',
        'description', 'review_text', 'message_text'
    ];

    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/`/g, '&#x60;');
    };

    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (!skipFields.includes(key) && typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        });
    }

    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        });
    }

    next();
};

// SQL injection prevention middleware
const preventSQLInjection = (req, res, next) => {
    const sqlKeywords = [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'OR', 'AND',
        'WHERE', 'FROM', 'TABLE', 'DATABASE', 'ALTER', 'CREATE', 'EXEC',
        'TRUNCATE', 'JOIN', 'HAVING', 'GROUP BY', 'ORDER BY'
    ];

    // Fields that contain binary/base64 data — skip SQL injection check
    const skipFields = ['avatar_url', 'cover_url', 'article_content', 'description', 'bio', 'review_text', 'message_text'];

    const checkForSQL = (value) => {
        if (typeof value !== 'string') return false;
        const upperValue = value.toUpperCase();
        return sqlKeywords.some(keyword => 
            upperValue.includes(keyword) && 
            (upperValue.includes('(') || upperValue.includes(')') || upperValue.includes(';'))
        );
    };

    // Check request body
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (skipFields.includes(key)) continue;
            if (checkForSQL(value)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid input detected in ${key}`
                });
            }
        }
    }

    // Check query parameters
    if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
            if (skipFields.includes(key)) continue;
            if (checkForSQL(value)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid query parameter detected in ${key}`
                });
            }
        }
    }

    next();
};

// CORS configuration - allow all common dev ports
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:8000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:3000'
        ];

        if (process.env.FRONTEND_URL) {
            allowedOrigins.push(process.env.FRONTEND_URL);
        }

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

// Request validation middleware
const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    };
};

// Common validation rules
const validationRules = {
    email: body('email')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    password: body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    
    username: body('username')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    fullName: body('fullName')
        .isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces')
};

module.exports = {
    apiLimiter,
    loginLimiter,
    registerLimiter,
    sanitizeInput,
    preventSQLInjection,
    corsOptions,
    securityHeaders,
    validateRequest,
    validationRules
};
