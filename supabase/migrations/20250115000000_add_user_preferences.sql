/*
  # Add User Preferences to Profiles
  
  Adds personalization fields to profiles table for better recommendations:
  - age: User's age (optional)
  - favorite_activities: Array of favorite activities
  - interests: Array of interests/hobbies
  - other_preferences: JSONB for flexible additional data
*/

-- Add personalization columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS favorite_activities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS other_preferences jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.age IS 'User age for personalized recommendations';
COMMENT ON COLUMN profiles.favorite_activities IS 'Array of favorite activities (e.g., ["yoga", "reading", "cooking"])';
COMMENT ON COLUMN profiles.interests IS 'Array of interests/hobbies (e.g., ["music", "travel", "photography"])';
COMMENT ON COLUMN profiles.other_preferences IS 'Flexible JSONB for additional preferences';
