/**
 * Database setup script
 * - Checks if the PostgreSQL database and user exist
 * - Creates them if they don't
 * - Runs Prisma migrations
 * - Runs the seed script
 *
 * Usage: npx ts-node scripts/setup-db.ts
 */

import { Client } from 'pg';
import { execSync } from 'child_process';
import * as path from 'path';

// Parse individual DB vars from .env.development
function loadDbConfig() {
  const fs = require('fs');
  const envPath = path.resolve(__dirname, '..', '.env.development');
  const envContent: string = fs.readFileSync(envPath, 'utf-8');

  const getVar = (name: string): string => {
    const match = envContent.match(new RegExp(`^${name}=(.+)$`, 'm'));
    if (!match) {
      throw new Error(`${name} not found in .env.development`);
    }
    return match[1].trim();
  };

  return {
    user: getVar('DB_USERNAME'),
    password: getVar('DB_PASSWORD'),
    host: getVar('DB_HOST'),
    port: parseInt(getVar('DB_PORT'), 10),
    database: getVar('DB_NAME'),
  };
}

function buildDatabaseUrl(config: { user: string; password: string; host: string; port: number; database: string }): string {
  // Cloud SQL Unix socket paths start with /cloudsql/
  if (config.host.startsWith('/cloudsql/')) {
    return `postgresql://${config.user}:${config.password}@localhost/${config.database}?schema=public&host=${config.host}`;
  }
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?schema=public`;
}

async function databaseExists(
  client: Client,
  dbName: string,
): Promise<boolean> {
  const result = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName],
  );
  return (result.rowCount ?? 0) > 0;
}

async function roleExists(
  client: Client,
  roleName: string,
): Promise<boolean> {
  const result = await client.query(
    'SELECT 1 FROM pg_roles WHERE rolname = $1',
    [roleName],
  );
  return (result.rowCount ?? 0) > 0;
}

async function main() {
  const config = loadDbConfig();
  const databaseUrl = buildDatabaseUrl(config);

  console.log('=== Cerebro Database Setup ===\n');
  console.log(`Target database: ${config.database}`);
  console.log(`Target user:     ${config.user}`);
  console.log(`Host:            ${config.host}:${config.port}\n`);

  // Connect to the default 'postgres' database as the postgres superuser
  const adminClient = new Client({
    host: config.host,
    port: config.port,
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('[OK] Connected to PostgreSQL as postgres\n');

    // 1. Check/create the application user
    if (await roleExists(adminClient, config.user)) {
      console.log(`[OK] Role "${config.user}" already exists`);
    } else {
      console.log(`[..] Creating role "${config.user}"...`);
      await adminClient.query(
        `CREATE ROLE "${config.user}" WITH LOGIN PASSWORD '${config.password}'`,
      );
      console.log(`[OK] Role "${config.user}" created`);
    }

    // 2. Check/create the database
    if (await databaseExists(adminClient, config.database)) {
      console.log(`[OK] Database "${config.database}" already exists`);
    } else {
      console.log(`[..] Creating database "${config.database}"...`);
      await adminClient.query(
        `CREATE DATABASE "${config.database}" OWNER "${config.user}"`,
      );
      console.log(`[OK] Database "${config.database}" created`);
    }

    // 3. Grant privileges
    console.log(`[..] Granting privileges...`);
    await adminClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE "${config.database}" TO "${config.user}"`,
    );
    console.log(`[OK] Privileges granted\n`);
  } catch (err) {
    console.error('[FAIL] Database setup error:', err.message);
    console.error(
      '\nMake sure PostgreSQL is running and the postgres password is correct.',
    );
    console.error(
      'Set POSTGRES_PASSWORD env var if your postgres password is not "postgres".\n',
    );
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 4. Run Prisma migrations
  console.log('[..] Running Prisma migrations...');
  try {
    execSync('npx prisma migrate dev --name init --skip-seed', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log('[OK] Migrations applied\n');
  } catch {
    console.error('[FAIL] Migration failed');
    process.exit(1);
  }

  // 5. Generate Prisma client
  console.log('[..] Generating Prisma client...');
  try {
    execSync('npx prisma generate', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log('[OK] Prisma client generated\n');
  } catch {
    console.error('[FAIL] Prisma generate failed');
    process.exit(1);
  }

  // 6. Run seed
  console.log('[..] Running seed...');
  try {
    execSync('npx ts-node prisma/seed.ts', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log('[OK] Seed completed\n');
  } catch {
    console.error('[FAIL] Seed failed');
    process.exit(1);
  }

  console.log('=== Setup Complete ===');
}

main();
