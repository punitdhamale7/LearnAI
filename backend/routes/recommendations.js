const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Main recommendation endpoint with enhanced AI algorithms
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        // Get user profile and learning analytics first
        const userProfile = await getUserLearningProfile(userId);
        
        // Run all recommendation strategies in parallel with user profile
        const [
            interestBasedRecs,
            performanceBasedRecs,
            skillBasedRecs,
            progressBasedRecs,
            collaborativeRecs,
            contentBasedRecs,
            weakAreaRecs,
            timeBasedRecs,
            difficultyProgressionRecs
        ] = await Promise.all([
            getInterestBasedRecommendations(userId, userProfile),
            getPerformanceBasedRecommendations(userId, userProfile),
            getSkillBasedRecommendations(userId),
            getProgressBasedRecommendations(userId),
            getCollaborativeFilteringRecs(userId),
            getContentBasedRecommendations(userId),
            getWeakAreaRecommendations(userId, userProfile),
            getTimeBasedRecommendations(userId, userProfile),
            getDifficultyProgressionRecs(userId)
        ]);
        
        // Combine and score recommendations using weighted algorithm
        const recommendations = combineAndScoreRecommendations({
            interestBased: interestBasedRecs,
            performanceBased: performanceBasedRecs,
            skillBased: skillBasedRecs,
            progressBased: progressBasedRecs,
            collaborative: collaborativeRecs,
            contentBased: contentBasedRecs,
            weakArea: weakAreaRecs,
            timeBased: timeBasedRecs,
            difficultyProgression: difficultyProgressionRecs
        }, userProfile);
        
        // Get top recommendations
        const topRecommendations = recommendations.slice(0, 12);
        const courseIds = topRecommendations.map(r => r.courseId);
        
        if (courseIds.length === 0) {
            // Fallback: Get courses user hasn't enrolled in yet
            const fallbackQuery = `
                SELECT c.id FROM courses c
                WHERE c.id NOT IN (SELECT COALESCE(course_id, 0) FROM enrollments WHERE user_id = ?)
                ORDER BY c.rating DESC, c.total_students DESC 
                LIMIT 8
            `;
            
            db.query(fallbackQuery, [userId], (err, fallbackCourses) => {
                if (err || fallbackCourses.length === 0) {
                    // Last resort: just get any popular courses
                    const lastResortQuery = `
                        SELECT id FROM courses 
                        ORDER BY rating DESC, total_students DESC 
                        LIMIT 6
                    `;
                    db.query(lastResortQuery, (err2, lastResort) => {
                        if (err2 || lastResort.length === 0) {
                            return res.json({ 
                                success: true, 
                                recommendations: [],
                                message: 'Start your learning journey! Browse our course catalog.' 
                            });
                        }
                        const lastResortIds = lastResort.map(c => c.id);
                        const lastResortRecs = lastResortIds.map((id, idx) => ({
                            courseId: id,
                            score: 8 - idx * 0.5,
                            reason: 'Popular course recommended for you',
                            confidence: 'medium'
                        }));
                        fetchAndReturnCourses(lastResortIds, res, 'Explore these popular courses!', lastResortRecs, userProfile);
                    });
                    return;
                }
                
                const fallbackIds = fallbackCourses.map(c => c.id);
                const fallbackRecs = fallbackIds.map((id, idx) => ({
                    courseId: id,
                    score: 9 - idx * 0.3,
                    reason: 'Recommended based on your profile',
                    confidence: 'high'
                }));
                fetchAndReturnCourses(fallbackIds, res, 'Courses selected for you!', fallbackRecs, userProfile);
            });
            return;
        }
        
        // Fetch full course details
        fetchAndReturnCourses(courseIds, res, null, topRecommendations, userProfile);
        
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ success: false, message: 'Error generating recommendations' });
    }
});

// Helper function to fetch and return course details
function fetchAndReturnCourses(courseIds, res, message = null, recommendations = null, userProfile = null) {
    const coursesQuery = `
        SELECT 
            c.*,
            COALESCE(AVG(cr.rating), 0) as average_rating,
            COUNT(DISTINCT cr.id) as total_reviews,
            COUNT(DISTINCT e.id) as total_students
        FROM courses c
        LEFT JOIN course_reviews cr ON c.id = cr.course_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.id IN (?)
        GROUP BY c.id
    `;
    
    db.query(coursesQuery, [courseIds], (err, courses) => {
        if (err) {
            console.error('Error fetching courses:', err);
            return res.status(500).json({ success: false, message: 'Error fetching recommendations' });
        }
        
        let recommendedCourses = courses;
        
        if (recommendations) {
            // Enrich courses with recommendation data
            recommendedCourses = courses.map(course => {
                const rec = recommendations.find(r => r.courseId === course.id);
                return {
                    ...course,
                    recommendation_score: rec.score,
                    recommendation_reason: rec.reason,
                    match_percentage: Math.min(98, Math.round((rec.score / 15) * 100)),
                    confidence: rec.confidence || 'high'
                };
            });
            
            // Sort by recommendation score
            recommendedCourses.sort((a, b) => b.recommendation_score - a.recommendation_score);
        }
        
        res.json({ 
            success: true, 
            recommendations: recommendedCourses,
            total: recommendedCourses.length,
            algorithm: 'AI-Powered Multi-Strategy Recommendation Engine',
            message: message,
            userProfile: userProfile ? {
                averageQuizScore: userProfile.avgQuizScore,
                learningPace: userProfile.learningPace,
                preferredDifficulty: userProfile.preferredDifficulty,
                strongAreas: userProfile.strongAreas,
                weakAreas: userProfile.weakAreas
            } : null
        });
    });
}

// Get comprehensive user learning profile
function getUserLearningProfile(userId) {
    return new Promise((resolve, reject) => {
        const profileQuery = `
            SELECT 
                u.id,
                u.full_name
            FROM users u
            WHERE u.id = ?
        `;
        
        db.query(profileQuery, [userId], (err, results) => {
            if (err) return reject(err);
            
            if (results.length === 0) {
                return resolve({
                    avgQuizScore: 0,
                    learningPace: 'moderate',
                    preferredDifficulty: 'Beginner',
                    strongAreas: [],
                    weakAreas: [],
                    interests: [],
                    skills: [],
                    totalEnrollments: 0,
                    avgProgress: 0,
                    currentStreak: 0
                });
            }
            
            // Get user stats
            const statsQuery = `SELECT * FROM user_stats WHERE user_id = ?`;
            db.query(statsQuery, [userId], (err2, statsResults) => {
                const stats = statsResults && statsResults.length > 0 ? statsResults[0] : {};
                
                // Get quiz performance
                const quizQuery = `
                    SELECT AVG(score / total_questions * 100) as avg_quiz_score
                    FROM quiz_attempts WHERE user_id = ?
                `;
                db.query(quizQuery, [userId], (err3, quizResults) => {
                    const avgQuizScore = quizResults && quizResults[0] ? quizResults[0].avg_quiz_score || 0 : 0;
                    
                    // Get enrollments
                    const enrollQuery = `
                        SELECT COUNT(*) as total, AVG(progress_percentage) as avg_progress
                        FROM enrollments WHERE user_id = ?
                    `;
                    db.query(enrollQuery, [userId], (err4, enrollResults) => {
                        const enrollData = enrollResults && enrollResults[0] ? enrollResults[0] : { total: 0, avg_progress: 0 };
                        
                        // Determine learning pace
                        let learningPace = 'moderate';
                        const lessonsCompleted = stats.total_lessons_completed || 0;
                        if (lessonsCompleted > 50) learningPace = 'fast';
                        else if (lessonsCompleted < 10) learningPace = 'slow';
                        
                        // Determine preferred difficulty
                        let preferredDifficulty = 'Beginner';
                        if (avgQuizScore >= 85) preferredDifficulty = 'Advanced';
                        else if (avgQuizScore >= 70) preferredDifficulty = 'Intermediate';
                        
                        // Get skills (if table exists)
                        const skillsQuery = `SELECT skill_name FROM user_skills WHERE user_id = ? LIMIT 5`;
                        db.query(skillsQuery, [userId], (err5, skillsResults) => {
                            const skills = skillsResults ? skillsResults.map(s => s.skill_name) : [];
                            
                            // Get interests (if table exists)
                            const interestsQuery = `SELECT interest_name FROM user_interests WHERE user_id = ? LIMIT 5`;
                            db.query(interestsQuery, [userId], (err6, interestsResults) => {
                                const interests = interestsResults ? interestsResults.map(i => i.interest_name) : [];
                                
                                resolve({
                                    avgQuizScore: avgQuizScore,
                                    learningPace: learningPace,
                                    preferredDifficulty: preferredDifficulty,
                                    strongAreas: [],
                                    weakAreas: [],
                                    interests: interests,
                                    skills: skills,
                                    totalEnrollments: enrollData.total || 0,
                                    avgProgress: enrollData.avg_progress || 0,
                                    currentStreak: stats.current_streak || 0
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// 1. Interest-Based Recommendations (NEW)
function getInterestBasedRecommendations(userId, userProfile) {
    return new Promise((resolve, reject) => {
        if (!userProfile.interests || userProfile.interests.length === 0) {
            return resolve([]);
        }
        
        const interests = userProfile.interests.map(i => `%${i.trim()}%`);
        const placeholders = interests.map(() => '(LOWER(c.title) LIKE ? OR LOWER(c.description) LIKE ?)').join(' OR ');
        const params = interests.flatMap(i => [i.toLowerCase(), i.toLowerCase()]);
        
        const query = `
            SELECT DISTINCT c.id as courseId, c.title, c.difficulty_level, c.rating
            FROM courses c
            WHERE (${placeholders})
            AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
            ORDER BY c.rating DESC, c.total_students DESC
            LIMIT 8
        `;
        
        db.query(query, [...params, userId], (err, results) => {
            if (err) return reject(err);
            
            const recommendations = results.map(course => ({
                courseId: course.courseId,
                title: course.title,
                score: 10,
                confidence: 'very high',
                reason: `Matches your interests: ${userProfile.interests.slice(0, 2).join(', ')}`
            }));
            
            resolve(recommendations);
        });
    });
}

// 2. Performance-Based Recommendations (NEW)
function getPerformanceBasedRecommendations(userId, userProfile) {
    return new Promise((resolve, reject) => {
        const avgScore = userProfile.avgQuizScore;
        
        // If performing well (>80%), suggest advanced courses
        // If struggling (<60%), suggest beginner/review courses
        // If moderate (60-80%), suggest intermediate courses
        
        let targetDifficulty = [];
        let reason = '';
        
        if (avgScore >= 80) {
            targetDifficulty = ['Advanced', 'Intermediate'];
            reason = `Your excellent performance (${Math.round(avgScore)}% avg) shows you're ready for advanced topics`;
        } else if (avgScore >= 60) {
            targetDifficulty = ['Intermediate'];
            reason = `Based on your solid performance (${Math.round(avgScore)}% avg), these courses match your level`;
        } else if (avgScore > 0) {
            targetDifficulty = ['Beginner', 'Intermediate'];
            reason = `These courses will help strengthen your foundation (current avg: ${Math.round(avgScore)}%)`;
        } else {
            targetDifficulty = ['Beginner'];
            reason = 'Perfect starting point for your learning journey';
        }
        
        const query = `
            SELECT c.id as courseId, c.title, c.difficulty_level, c.rating
            FROM courses c
            WHERE c.difficulty_level IN (?)
            AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
            ORDER BY c.rating DESC
            LIMIT 6
        `;
        
        db.query(query, [targetDifficulty, userId], (err, results) => {
            if (err) return reject(err);
            
            const score = avgScore >= 80 ? 11 : (avgScore >= 60 ? 9 : 8);
            
            const recommendations = results.map(course => ({
                courseId: course.courseId,
                title: course.title,
                score: score,
                confidence: 'high',
                reason: reason
            }));
            
            resolve(recommendations);
        });
    });
}

// 3. Weak Area Recommendations (NEW)
function getWeakAreaRecommendations(userId, userProfile) {
    return new Promise((resolve, reject) => {
        if (!userProfile.weakAreas || userProfile.weakAreas.length === 0) {
            return resolve([]);
        }
        
        const weakAreas = userProfile.weakAreas.map(w => `%${w.trim()}%`);
        const placeholders = weakAreas.map(() => '(LOWER(c.title) LIKE ? OR LOWER(c.description) LIKE ?)').join(' OR ');
        const params = weakAreas.flatMap(w => [w.toLowerCase(), w.toLowerCase()]);
        
        const query = `
            SELECT DISTINCT c.id as courseId, c.title, c.difficulty_level
            FROM courses c
            WHERE (${placeholders})
            AND c.difficulty_level IN ('Beginner', 'Intermediate')
            AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
            LIMIT 5
        `;
        
        db.query(query, [...params, userId], (err, results) => {
            if (err) return reject(err);
            
            const recommendations = results.map(course => ({
                courseId: course.courseId,
                title: course.title,
                score: 12,
                confidence: 'very high',
                reason: `Strengthen your skills in areas that need improvement`
            }));
            
            resolve(recommendations);
        });
    });
}

// 4. Time-Based Recommendations (NEW)
function getTimeBasedRecommendations(userId, userProfile) {
    return new Promise((resolve, reject) => {
        // Recommend shorter courses for slow learners, longer for fast learners
        const durationCondition = userProfile.learningPace === 'fast' 
            ? 'c.duration_hours >= 30' 
            : 'c.duration_hours <= 25';
        
        const query = `
            SELECT c.id as courseId, c.title, c.duration_hours, c.difficulty_level
            FROM courses c
            WHERE ${durationCondition}
            AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
            ORDER BY c.rating DESC
            LIMIT 5
        `;
        
        db.query(query, [userId], (err, results) => {
            if (err) return reject(err);
            
            const reason = userProfile.learningPace === 'fast'
                ? 'Comprehensive course perfect for your fast learning pace'
                : 'Bite-sized course that fits your learning style';
            
            const recommendations = results.map(course => ({
                courseId: course.courseId,
                title: course.title,
                score: 7,
                confidence: 'medium',
                reason: reason
            }));
            
            resolve(recommendations);
        });
    });
}


// 5. Skill-Based Recommendations
function getSkillBasedRecommendations(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT DISTINCT c.id as courseId, c.title, c.difficulty_level
            FROM user_skills us
            JOIN courses c ON (
                LOWER(c.title) LIKE CONCAT('%', LOWER(us.skill_name), '%') OR
                LOWER(c.description) LIKE CONCAT('%', LOWER(us.skill_name), '%')
            )
            WHERE us.user_id = ?
            AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
            LIMIT 5
        `;
        
        db.query(query, [userId, userId], (err, results) => {
            if (err) return reject(err);
            
            const recommendations = results.map(course => ({
                courseId: course.courseId,
                title: course.title,
                score: 8,
                confidence: 'high',
                reason: `Matches your skills and expertise`
            }));
            
            resolve(recommendations);
        });
    });
}

// 6. Progress-Based Recommendations (Next logical step)
function getProgressBasedRecommendations(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT c.id, c.title, c.difficulty_level, e.progress_percentage
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ?
            AND e.progress_percentage >= 70
            ORDER BY e.progress_percentage DESC, e.last_accessed DESC
            LIMIT 3
        `;
        
        db.query(query, [userId], (err, enrolledCourses) => {
            if (err) return reject(err);
            
            if (enrolledCourses.length === 0) {
                return resolve([]);
            }
            
            const recommendations = [];
            let completed = 0;
            
            // Difficulty progression map
            const progressionMap = {
                'Beginner': ['Intermediate', 'Beginner'],
                'Intermediate': ['Advanced', 'Intermediate'],
                'Advanced': ['Advanced']
            };
            
            const processNextCourse = (index) => {
                if (index >= enrolledCourses.length) {
                    return resolve(recommendations);
                }
                
                const course = enrolledCourses[index];
                const nextLevels = progressionMap[course.difficulty_level] || ['Intermediate'];
                
                const nextLevelQuery = `
                    SELECT id as courseId, title, difficulty_level
                    FROM courses
                    WHERE difficulty_level IN (?)
                    AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
                    AND id != ?
                    ORDER BY rating DESC
                    LIMIT 2
                `;
                
                db.query(nextLevelQuery, [nextLevels, userId, course.id], (err2, nextCourses) => {
                    if (!err2 && nextCourses.length > 0) {
                        nextCourses.forEach(nc => {
                            recommendations.push({
                                courseId: nc.courseId,
                                title: nc.title,
                                score: 11,
                                confidence: 'very high',
                                reason: `Perfect next step after ${course.title} (${Math.round(course.progress_percentage)}% complete)`
                            });
                        });
                    }
                    processNextCourse(index + 1);
                });
            };
            
            processNextCourse(0);
        });
    });
}

// 7. Collaborative Filtering (Users with similar patterns)
function getCollaborativeFilteringRecs(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                c.id as courseId,
                c.title,
                COUNT(DISTINCT e2.user_id) as similar_users_count,
                AVG(e2.progress_percentage) as avg_progress
            FROM enrollments e1
            JOIN enrollments e2 ON e1.course_id = e2.course_id AND e2.user_id != e1.user_id
            JOIN enrollments e3 ON e2.user_id = e3.user_id
            JOIN courses c ON e3.course_id = c.id
            WHERE e1.user_id = ?
            AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
            GROUP BY c.id, c.title
            HAVING COUNT(DISTINCT e2.user_id) >= 1
            ORDER BY similar_users_count DESC, avg_progress DESC
            LIMIT 5
        `;
        
        db.query(query, [userId, userId], (err, results) => {
            if (err) return reject(err);
            
            const recommendations = results.map(course => ({
                courseId: course.courseId,
                title: course.title,
                score: 9,
                confidence: 'high',
                reason: `${course.similar_users_count} learner${course.similar_users_count > 1 ? 's' : ''} with similar interests enrolled`
            }));
            
            resolve(recommendations);
        });
    });
}

// 8. Content-Based Recommendations (Similar courses)
function getContentBasedRecommendations(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT c2.id as courseId, c2.title, c2.difficulty_level,
                   COUNT(*) as similarity_score
            FROM enrollments e
            JOIN courses c1 ON e.course_id = c1.id
            JOIN courses c2 ON (
                c1.difficulty_level = c2.difficulty_level OR
                c1.instructor_name = c2.instructor_name
            )
            WHERE e.user_id = ?
            AND c2.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
            AND c2.id != c1.id
            GROUP BY c2.id, c2.title, c2.difficulty_level
            ORDER BY similarity_score DESC
            LIMIT 5
        `;
        
        db.query(query, [userId, userId], (err, results) => {
            if (err) return reject(err);
            
            const recommendations = results.map(course => ({
                courseId: course.courseId,
                title: course.title,
                score: 7,
                confidence: 'medium',
                reason: `Similar to courses you're currently learning`
            }));
            
            resolve(recommendations);
        });
    });
}

// 9. Difficulty Progression Recommendations
function getDifficultyProgressionRecs(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                c.difficulty_level,
                AVG(e.progress_percentage) as avg_progress,
                AVG(qa.score / qa.total_questions * 100) as avg_quiz_score,
                COUNT(DISTINCT e.course_id) as course_count
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN lessons l ON l.course_id = c.id
            LEFT JOIN quiz_attempts qa ON qa.lesson_id = l.id AND qa.user_id = e.user_id
            WHERE e.user_id = ?
            GROUP BY c.difficulty_level
            ORDER BY 
                CASE c.difficulty_level
                    WHEN 'Beginner' THEN 1
                    WHEN 'Intermediate' THEN 2
                    WHEN 'Advanced' THEN 3
                END DESC
        `;
        
        db.query(query, [userId], (err, results) => {
            if (err) return reject(err);
            
            let recommendedLevel = 'Beginner';
            let reason = 'Perfect starting point for your learning journey';
            
            if (results.length > 0) {
                const latestLevel = results[0].difficulty_level;
                const avgProgress = results[0].avg_progress || 0;
                const avgQuizScore = results[0].avg_quiz_score || 0;
                
                // Smart progression based on both progress and quiz performance
                if (avgProgress >= 75 && avgQuizScore >= 75) {
                    // Excellent performance - move to next level
                    if (latestLevel === 'Beginner') {
                        recommendedLevel = 'Intermediate';
                        reason = `Your strong performance (${Math.round(avgQuizScore)}% quiz avg) shows you're ready for intermediate level`;
                    } else if (latestLevel === 'Intermediate') {
                        recommendedLevel = 'Advanced';
                        reason = `Excellent progress! Ready for advanced challenges`;
                    } else {
                        recommendedLevel = 'Advanced';
                        reason = `Continue mastering advanced topics`;
                    }
                } else if (avgProgress >= 50 && avgQuizScore >= 60) {
                    // Good performance - stay at current level or slightly higher
                    recommendedLevel = latestLevel;
                    reason = `Build confidence at ${latestLevel.toLowerCase()} level`;
                } else {
                    // Needs more practice - stay at current or go back
                    if (latestLevel === 'Advanced' || latestLevel === 'Intermediate') {
                        recommendedLevel = 'Intermediate';
                        reason = `Strengthen fundamentals with intermediate courses`;
                    } else {
                        recommendedLevel = 'Beginner';
                        reason = `Master the basics with beginner-friendly courses`;
                    }
                }
            }
            
            const recQuery = `
                SELECT id as courseId, title, difficulty_level, rating
                FROM courses
                WHERE difficulty_level = ?
                AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
                ORDER BY rating DESC, total_students DESC
                LIMIT 4
            `;
            
            db.query(recQuery, [recommendedLevel, userId], (err2, courses) => {
                if (err2) return reject(err2);
                
                const recommendations = courses.map(course => ({
                    courseId: course.courseId,
                    title: course.title,
                    score: 8,
                    confidence: 'high',
                    reason: reason
                }));
                
                resolve(recommendations);
            });
        });
    });
}

// Combine and score recommendations using weighted algorithm
function combineAndScoreRecommendations(strategies, userProfile) {
    const scoreMap = new Map();
    
    // Enhanced weights based on user profile
    const weights = {
        interestBased: 1.8,           // Highest - user explicitly stated interests
        weakArea: 1.7,                // Very high - help improve weak areas
        performanceBased: 1.6,        // High - based on actual quiz performance
        progressBased: 1.5,           // High - logical next steps
        collaborative: 1.3,           // Medium-high - social proof
        skillBased: 1.2,              // Medium - matches existing skills
        difficultyProgression: 1.1,   // Medium - appropriate difficulty
        contentBased: 1.0,            // Medium - similar content
        timeBased: 0.9                // Lower - secondary factor
    };
    
    // Combine all recommendations
    Object.entries(strategies).forEach(([strategyName, recommendations]) => {
        const weight = weights[strategyName] || 1.0;
        
        recommendations.forEach(rec => {
            const key = rec.courseId;
            
            if (scoreMap.has(key)) {
                const existing = scoreMap.get(key);
                existing.score += rec.score * weight;
                existing.reasons.push(rec.reason);
                existing.strategies.push(strategyName);
                // Keep highest confidence
                if (rec.confidence === 'very high') existing.confidence = 'very high';
            } else {
                scoreMap.set(key, {
                    courseId: rec.courseId,
                    title: rec.title,
                    score: rec.score * weight,
                    reasons: [rec.reason],
                    strategies: [strategyName],
                    confidence: rec.confidence || 'medium'
                });
            }
        });
    });
    
    // Convert to array and select best reason
    const recommendations = Array.from(scoreMap.values()).map(rec => ({
        courseId: rec.courseId,
        title: rec.title,
        score: rec.score,
        reason: rec.reasons[0], // Use the first (usually most relevant) reason
        strategyCount: rec.strategies.length,
        confidence: rec.confidence
    }));
    
    // Sort by score (higher is better)
    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations;
}


router.get('/:userId/explain/:courseId', (req, res) => {
    const { userId, courseId } = req.params;
    
    const query = `
        SELECT 
            c.title,
            c.difficulty_level,
            (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_students,
            COALESCE(AVG(cr.rating), 0) as avg_rating,
            (SELECT COUNT(*) FROM enrollments e2 
             WHERE e2.course_id = c.id 
             AND e2.user_id IN (
                 SELECT DISTINCT e1.user_id 
                 FROM enrollments e1 
                 WHERE e1.course_id IN (
                     SELECT course_id FROM enrollments WHERE user_id = ?
                 )
             )) as similar_users_enrolled
        FROM courses c
        LEFT JOIN course_reviews cr ON c.id = cr.course_id
        WHERE c.id = ?
        GROUP BY c.id
    `;
    
    db.query(query, [userId, courseId], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ success: false, message: 'Error fetching explanation' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        const course = results[0];
        const reasons = [];
        
        if (course.avg_rating >= 4) {
            reasons.push(`Highly rated course (${course.avg_rating.toFixed(1)}⭐)`);
        }
        
        if (course.total_students > 100) {
            reasons.push(`Popular with ${course.total_students} students`);
        }
        
        if (course.similar_users_enrolled > 0) {
            reasons.push(`${course.similar_users_enrolled} students with similar interests enrolled`);
        }
        
        res.json({
            success: true,
            course: course.title,
            reasons: reasons.length > 0 ? reasons : ['Recommended based on your profile']
        });
    });
});

module.exports = router;
