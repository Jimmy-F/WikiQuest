-- Remove auth.users foreign key constraint to allow standalone users
-- This allows the extension to work without Supabase Auth

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Make email and username optional for standalone users
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP CONSTRAINT IF EXISTS users_email_key;

-- Add unique constraint but allow NULL
CREATE UNIQUE INDEX users_email_key ON users(email) WHERE email IS NOT NULL;
