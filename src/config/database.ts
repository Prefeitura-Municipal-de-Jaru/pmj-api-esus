import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]: Falha inesperada no cliente inativo da pool:', err.message);
});

export async function checkDatabaseConnection(): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT 1 as status');
    return res.rows[0]?.status === 1;
  } finally {
    client.release();
  }
}
