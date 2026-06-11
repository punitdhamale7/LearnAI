-- Update users table with profile fields
USE learnai_db;

-- Add missing columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT AFTER password,
ADD COLUMN IF NOT EXISTS date_of_birth DATE AFTER avatar_url,
ADD COLUMN IF NOT EXISTS gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') AFTER date_of_birth,
ADD COLUMN IF NOT EXISTS bio TEXT AFTER gender,
ADD COLUMN IF NOT EXISTS college VARCHAR(200) AFTER bio,
ADD COLUMN IF NOT EXISTS degree VARCHAR(100) AFTER college,
ADD COLUMN IF NOT EXISTS branch VARCHAR(100) AFTER degree,
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100) AFTER branch,
ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50) AFTER specialization,
ADD COLUMN IF NOT EXISTS graduation_year INT AFTER year_of_study,
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255) AFTER graduation_year,
ADD COLUMN IF NOT EXISTS github_url VARCHAR(255) AFTER linkedin_url,
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255) AFTER github_url,
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255) AFTER twitter_url;

-- Show updated table structure
DESCRIBE users;
