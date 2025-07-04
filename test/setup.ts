// test/setup.ts
import * as pg from 'pg';
import { execSync } from 'child_process';
import * as path from 'path';

import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, './.env') });

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

const setupDatabase = async () => {
  const client = new pg.Client({
    host: DB_HOST!,
    port: parseInt(DB_PORT! || '5432', 10),
    user: DB_USERNAME!,
    password: DB_PASSWORD!,
    database: 'postgres',
  });
  try {
    await client.connect();

    // Check if the DB exists
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'`,
    );

    if (dbCheck.rows.length > 0) {
      console.log(`🗑️ Dropping existing test DB: ${DB_NAME}`);
      // Terminate active connections and drop the DB
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid()
      `);
      await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
    }

    console.log(`🆕 Creating fresh test DB: ${DB_NAME}`);
    await client.query(`CREATE DATABASE "${DB_NAME}"`);

    await client.end();

    // Run migrations
    console.log('🛠️ Running migrations...');
    execSync('pnpm migrate:run', {
      stdio: 'inherit',
      env: process.env,
    });

    console.log('✅ Test DB setup complete.');
  } catch (err) {
    console.error('❌ Error during test DB setup:', err);
    process.exit(1);
  }
};

setupDatabase();
