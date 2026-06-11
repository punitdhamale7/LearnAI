const updateCourseRating = (db, courseId) => {
    const query = `
        UPDATE courses 
        SET 
            average_rating = (
                SELECT ROUND(AVG(rating), 2)
                FROM course_reviews
                WHERE course_id = ?
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM course_reviews
                WHERE course_id = ?
            )
        WHERE id = ?
    `;
    
    db.query(query, [courseId, courseId, courseId], (err) => {
        if (err) {
            console.error('Error updating course rating:', err);
        }
    });
};


const updateEnrollmentProgress = (db, userId, courseId) => {
    const query = `
        UPDATE enrollments e
        SET 
            completed_lessons = (
                SELECT COUNT(*) 
                FROM lesson_progress lp 
                WHERE lp.user_id = ? AND lp.course_id = ? AND lp.is_completed = TRUE
            ),
            progress_percentage = (
                SELECT ROUND((COUNT(CASE WHEN lp.is_completed = TRUE THEN 1 END) / COUNT(l.id)) * 100, 2)
                FROM lessons l
                LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
                WHERE l.course_id = ?
            )
        WHERE e.user_id = ? AND e.course_id = ?
    `;
    
    db.query(query, [userId, courseId, userId, courseId, userId, courseId], (err) => {
        if (err) {
            console.error('Error updating enrollment progress:', err);
        }
    });
};


const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};


const calculatePercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
};

module.exports = {
    updateCourseRating,
    updateEnrollmentProgress,
    formatDate,
    calculatePercentage
};
