const jwt = require('jsonwebtoken');


const generateToken = (userId, email, role = 'user') => {
    return jwt.sign(
        { 
            userId, 
            email, 
            role,
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } 
    );
};


const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } 
    );
};


const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};


const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
};


const verifyAuth = (req, res, next) => {
    const token = extractToken(req);
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }

    
    req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
    };

    next();
};


const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    extractToken,
    verifyAuth,
    verifyAdmin
};
