#!/usr/bin/env node
/**
 * Migration 082 Executor
 * Runs the multilingual content migration
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.error('Please set it in .env.local file');
    process.exit(1);
  }

  console.log('🚀 Starting Migration 082...\n');

  // Read SQL file
  const migrationPath = path.join(__dirname, '../database/migrations/082_migrate_content_to_multilingual.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file loaded:', migrationPath);
  console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

  // Try to use pg library
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⚙️  Running migration...');
    const result = await client.query(migrationSQL);

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 Result:', result);

    // Now run verification
    console.log('\n🔍 Running verification...\n');
    const verifyPath = path.join(__dirname, '../database/migrations/082_verify.sql');
    const verifySQL = fs.readFileSync(verifyPath, 'utf8');

    const verifyResult = await client.query(verifySQL);
    console.log('\n✅ Verification completed!\n');

    await client.end();
    console.log('\n🎉 Migration 082 executed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during migration:');
    console.error(error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
