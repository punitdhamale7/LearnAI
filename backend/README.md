# LearnAI Backend - Professional Structure

## Folder Structure

```
backend/
├── config/
│   └── database.js           # Database configuration
├── controllers/
│   └── authController.js     # Authentication business logic
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation middleware
│   └── errorHandler.js      # Error handling middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── courses.js           # Course routes
│   ├── lessons.js           # Lesson routes
│   └── reviews.js           # Review routes
├── utils/
│   └── helpers.js           # Helper functions
├── database/
│   └── *.sql                # Database schemas
├── server.js                # Main server (organized structure)
├── emailService.js          # Email service
├── .env                     # Environment variables
├── package.json             # Dependencies
└── README.md                # This file
```

## 🚀 Quick Start

```bash
cd backend
node server.js
```

## 📋 What's Different?

### Before
- ❌ 2318 lines in one file
- ❌ All logic mixed together
- ❌ Hard to maintain
- ❌ Difficult to test

### Now
- ✅ Separated into logical modules
- ✅ Controllers handle business logic
- ✅ Middleware for validation & auth
- ✅ Routes are clean and simple
- ✅ Easy to maintain and test
- ✅ Professional industry standard

## 📦 Components

### Config
- **database.js**: Centralized database connection

### Controllers
- **authController.js**: Handles all authentication logic
  - Register
  - Login
  - Password reset
  - Admin login

### Middleware
- **auth.js**: Authentication & authorization
  - verifyAuth: Check if user is authenticated
  - verifyAdmin: Check if user is admin

- **validation.js**: Input validation
  - validateRegistration
  - validateLogin
  - validateEnrollment
  - validateReview

- **errorHandler.js**: Error handling
  - handleDatabaseError
  - errorHandler
  - notFound

### Routes
- **auth.js**: Authentication endpoints
- **courses.js**: Course management
- **lessons.js**: Lesson & quiz management
- **reviews.js**: Course reviews

### Utils
- **helpers.js**: Reusable helper functions
  - updateCourseRating
  - updateEnrollmentProgress
  - formatDate
  - calculatePercentage

## 🔌 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/forgot-password` - Request password reset
- GET `/api/auth/verify-reset-token/:token` - Verify reset token
- POST `/api/auth/reset-password` - Reset password

### Courses
- GET `/api/courses` - Get all courses
- GET `/api/courses/:id` - Get course by ID
- GET `/api/courses/:id/curriculum` - Get course curriculum
- POST `/api/courses/enroll` - Enroll in course

### Lessons
- GET `/api/lessons/:id` - Get lesson details
- POST `/api/lessons/:id/complete` - Mark lesson complete
- GET `/api/lessons/:id/quiz` - Get quiz questions
- POST `/api/lessons/:id/quiz/submit` - Submit quiz

### Reviews
- GET `/api/courses/:courseId/reviews` - Get course reviews
- POST `/api/courses/:courseId/reviews` - Submit review

### Admin
- POST `/api/admin/login` - Admin login

## 🔧 Environment Variables

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Punit@1672
DB_NAME=learnai_db
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🎯 Benefits

1. **Separation of Concerns**
   - Each file has a single responsibility
   - Easy to locate and modify code

2. **Maintainability**
   - Small, focused files
   - Clear code organization
   - Easy to understand

3. **Scalability**
   - Easy to add new features
   - Can grow without becoming messy
   - Team-friendly structure

4. **Testability**
   - Can test individual components
   - Mock dependencies easily
   - Better test coverage

5. **Professional**
   - Industry-standard structure
   - Follows best practices
   - Production-ready

## 🔄 How It Works

The server now uses a professional MVC-like architecture:

1. **Request comes in** → Routes receive it
2. **Middleware validates** → Checks auth & input
3. **Controller processes** → Business logic executes
4. **Database queries** → Data is fetched/updated
5. **Response sent back** → JSON response to client

All functionality remains the same - just better organized!

## 📝 Notes

- All functionality is preserved
- No breaking changes
- Frontend works without modifications
- Database remains unchanged
- Email service unchanged

## 🏆 Result

Your backend is now:
- ✅ Professional quality
- ✅ Easy to maintain
- ✅ Well organized
- ✅ Production ready
- ✅ Team friendly

## 📞 Support

If you encounter issues:
1. Check `.env` file configuration
2. Ensure database is running
3. Verify port 3001 is available
4. Check console for error messages
