const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});


const emailTemplates = {
    welcome: (userName, userEmail) => ({
        subject: 'Welcome to LearnAI Platform! 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                    .feature { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
                    .feature-icon { font-size: 24px; margin-right: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Welcome to LearnAI!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${userName}! 👋</h2>
                        <p>Thank you for joining LearnAI Platform. We're excited to have you on board!</p>
                        
                        <p>Your account has been successfully created with email: <strong>${userEmail}</strong></p>
                        
                        <h3>What's Next?</h3>
                        <div class="feature">
                            <span class="feature-icon">📚</span>
                            <strong>Browse Courses:</strong> Explore our wide range of courses in Web Development, Data Science, AI, and more.
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🎯</span>
                            <strong>Set Your Goals:</strong> Complete your profile and start your learning journey.
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🏆</span>
                            <strong>Earn Achievements:</strong> Unlock badges and track your progress as you learn.
                        </div>
                        
                        <center>
                            <a href="http://localhost:8000/dashboard.html" class="button">Go to Dashboard</a>
                        </center>
                        
                        <p>If you have any questions, feel free to reach out to our support team.</p>
                        
                        <p>Happy Learning!<br>The LearnAI Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 LearnAI Platform. All rights reserved.</p>
                        <p>This email was sent to ${userEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    enrollment: (userName, courseName, courseId) => ({
        subject: `Enrollment Confirmed: ${courseName} 🎓`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .course-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Enrollment Confirmed!</h1>
                    </div>
                    <div class="content">
                        <h2>Congratulations, ${userName}!</h2>
                        <p>You have successfully enrolled in:</p>
                        
                        <div class="course-box">
                            <h3>📚 ${courseName}</h3>
                            <p>You now have full access to all course materials, lessons, and resources.</p>
                        </div>
                        
                        <h3>What's Included:</h3>
                        <ul>
                            <li>✓ Full lifetime access to course content</li>
                            <li>✓ Video lessons and downloadable resources</li>
                            <li>✓ Quizzes and assignments</li>
                            <li>✓ Progress tracking and certificates</li>
                            <li>✓ Community support</li>
                        </ul>
                        
                        <center>
                            <a href="http://localhost:8000/course-player.html?courseId=${courseId}" class="button">Start Learning Now</a>
                        </center>
                        
                        <p>Ready to begin your learning journey? Click the button above to access your course!</p>
                        
                        <p>Best regards,<br>The LearnAI Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 LearnAI Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    achievement: (userName, achievementName, achievementDescription, points) => ({
        subject: `🏆 Achievement Unlocked: ${achievementName}!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .achievement-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 3px solid #fbbf24; }
                    .achievement-icon { font-size: 64px; margin-bottom: 15px; }
                    .points { background: #fbbf24; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; }
                    .button { display: inline-block; background: #fbbf24; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Achievement Unlocked!</h1>
                    </div>
                    <div class="content">
                        <h2>Awesome work, ${userName}!</h2>
                        <p>You've just unlocked a new achievement!</p>
                        
                        <div class="achievement-box">
                            <div class="achievement-icon">🏆</div>
                            <h2>${achievementName}</h2>
                            <p>${achievementDescription}</p>
                            <div class="points">+${points} Points</div>
                        </div>
                        
                        <p>Keep up the great work! Continue learning to unlock more achievements and earn rewards.</p>
                        
                        <center>
                            <a href="http://localhost:8000/achievements.html" class="button">View All Achievements</a>
                        </center>
                        
                        <p>Stay motivated and keep learning!<br>The LearnAI Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 LearnAI Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    passwordReset: (userName, resetToken) => ({
        subject: 'Password Reset Request - LearnAI Platform 🔐',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .token-box { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 18px; text-align: center; border: 2px dashed #d1d5db; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${userName},</h2>
                        <p>We received a request to reset your password for your LearnAI account.</p>
                        
                        <p>Use the following reset token to create a new password:</p>
                        
                        <div class="token-box">
                            ${resetToken}
                        </div>
                        
                        <center>
                            <a href="http://localhost:8000/reset-password.html?token=${resetToken}" class="button">Reset Password</a>
                        </center>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <ul>
                                <li>This reset token will expire in 1 hour</li>
                                <li>If you didn't request this, please ignore this email</li>
                                <li>Never share this token with anyone</li>
                            </ul>
                        </div>
                        
                        <p>If you have any concerns about your account security, please contact our support team immediately.</p>
                        
                        <p>Best regards,<br>The LearnAI Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 LearnAI Platform. All rights reserved.</p>
                        <p>This is an automated security email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};


async function sendEmail(to, template) {
    try {
        const mailOptions = {
            from: `"LearnAI Platform" <${process.env.EMAIL_USER || 'noreply@learnai.com'}>`,
            to: to,
            subject: template.subject,
            html: template.html
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('✗ Email error:', error.message);
        return { success: false, error: error.message };
    }
}


module.exports = {
    sendWelcomeEmail: async (userName, userEmail) => {
        const template = emailTemplates.welcome(userName, userEmail);
        return await sendEmail(userEmail, template);
    },
    
    sendEnrollmentEmail: async (userName, userEmail, courseName, courseId) => {
        const template = emailTemplates.enrollment(userName, courseName, courseId);
        return await sendEmail(userEmail, template);
    },
    
    sendAchievementEmail: async (userName, userEmail, achievementName, achievementDescription, points) => {
        const template = emailTemplates.achievement(userName, achievementName, achievementDescription, points);
        return await sendEmail(userEmail, template);
    },
    
    sendPasswordResetEmail: async (userName, userEmail, resetToken) => {
        const template = emailTemplates.passwordReset(userName, resetToken);
        return await sendEmail(userEmail, template);
    }
};
