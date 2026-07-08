const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:adminpassword@localhost:5432/srwaffle' });
pool.query('SELECT yield_qty FROM masas WHERE id = $1', ['masa_tradicional']).then(res => {
  console.log('yield_qty:', res.rows[0].yield_qty);
  pool.end();
}).catch(console.error);
