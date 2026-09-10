import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase's pooler requires SSL but doesn't serve a CA cert by default.
  // Use rejectUnauthorized: false for now; for production, download the root
  // cert from the Supabase dashboard and pass it via the `ca` option instead.
  ssl: { rejectUnauthorized: false },
});

async function checkConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection successful');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    throw err;
  }
}

export { pool, checkConnection };
