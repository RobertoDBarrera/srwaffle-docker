const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: connectionString && (connectionString.includes('neon.tech') || connectionString.includes('supabase') || connectionString.includes('render.com'))
    ? { rejectUnauthorized: false }
    : false
});

let usePostgres = false;

const connectDb = async () => {
  if (!connectionString) {
    console.log('Modo EMULACIÓN LOCAL (JSON) activado para DB Estricta.');
    return false;
  }
  try {
    const client = await pool.connect();
    client.release();
    usePostgres = true;
    console.log('Conexión PostgreSQL establecida (DB Estricta).');
    return true;
  } catch (err) {
    console.log('Error PostgreSQL. Fallback a EMULACIÓN LOCAL (JSON).', err.message);
    return false;
  }
};

module.exports = {
  pool,
  connectDb,
  isPostgres: () => usePostgres,
  setPostgres: (val) => { usePostgres = val; }
};
