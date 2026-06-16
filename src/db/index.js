const { pool, connectDb, isPostgres } = require('./pool');
const { initDB } = require('./init');
const stockApi = require('./stock');
const masasApi = require('./masas');
const wafflesApi = require('./waffles');
const menuApi = require('./menu');
const salesApi = require('./sales');
const settingsApi = require('./settings');

// Initialize
connectDb().then(() => initDB());

module.exports = {
  pool,
  isPostgres,
  ...stockApi,
  ...masasApi,
  ...wafflesApi,
  ...menuApi,
  ...salesApi,
  ...settingsApi
};
