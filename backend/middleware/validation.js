const security = require('./security');


const validateRegistration = security.validateRequest([
    security.validationRules.fullName,
    security.validationRules.username,
    security.validationRules.email,
    security.validationRules.password
]);


const validateLogin = (req, res, next) => {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email/username and password are required'
        });
    }
    
    next();
};


const validateEnrollment = (req, res, next) => {
    const { user_id, course_id } = req.body;
    
    if (!user_id || !course_id) {
        return res.status(400).json({
            success: false,
            message: 'User ID and Course ID are required'
        });
    }
    
    next();
};


const validateReview = (req, res, next) => {
    const { user_id, rating } = req.body;
    
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
    
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateEnrollment,
    validateReview
};
