require('dotenv').config();
const { pool } = require('./src/db/pool');

async function purge() {
  try {
    const res = await pool.query('UPDATE sales SET "kdsStatus" = $1 WHERE "kdsStatus" != $1 AND date < CURRENT_DATE', ['delivered']);
    console.log(`Purged ${res.rowCount} old tickets.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

purge();
