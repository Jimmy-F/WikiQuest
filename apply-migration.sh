#!/bin/bash
# Apply database migration to remove auth constraint

source .env

psql "$SUPABASE_URL" -c "
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
DROP INDEX IF EXISTS users_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email) WHERE email IS NOT NULL;
"

echo "Migration applied successfully!"
