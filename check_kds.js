const pool = require('./src/db/pool');
pool.connectDb().then(async () => {
    const res = await pool.pool.query('SELECT "kdsStatus", count(*) FROM sales GROUP BY "kdsStatus"');
    console.log(res.rows);
    process.exit(0);
});
