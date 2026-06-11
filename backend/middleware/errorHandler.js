const handleDatabaseError = (err, res) => {
    console.error('Database error:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry - record already exists'
        });
    }
    
    return res.status(500).json({
        success: false,
        message: 'Database error occurred'
    });
};


const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};


const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
};

module.exports = {
    handleDatabaseError,
    errorHandler,
    notFound
};
