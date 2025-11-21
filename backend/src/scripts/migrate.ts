// Run database migration to fix user table constraints
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../../../supabase/migrations/002_remove_auth_constraint.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration:', migrationPath);
    console.log('SQL:', sql);

    // Note: Supabase JS client doesn't support raw SQL execution
    // You need to run this in the Supabase SQL editor or use psql
    console.log('\n⚠️  Please run this SQL in your Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/ghmidhpmfbxonhcqtcmo/sql/new');
    console.log('\n' + sql);

  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigration();
