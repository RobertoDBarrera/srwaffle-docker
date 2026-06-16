const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');

const getSettings = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
    if (res.rows.length === 0) return {};
    const r = res.rows[0];
    return {
      adminPassword: r.admin_password,
      cashierPin: r.cashier_pin,
      ...((typeof r.data === 'string' ? JSON.parse(r.data) : r.data) || {})
    };
  }
  return readJSON('settings.json', {});
};

const updateSettings = async (settings) => {
  if (isPostgres()) {
    const data = { ...settings };
    delete data.adminPassword;
    delete data.cashierPin;
    await pool.query(
      'UPDATE settings SET admin_password = COALESCE($1, admin_password), cashier_pin = COALESCE($2, cashier_pin), data = $3',
      [settings.adminPassword, settings.cashierPin, JSON.stringify(data)]
    );
  } else {
    const current = readJSON('settings.json', {});
    writeJSON('settings.json', { ...current, ...settings });
  }
  return await getSettings();
};

const getEmployees = async () => { return readJSON('employees.json', []); };
const getLoyaltyCustomers = async () => { return readJSON('loyalty_customers.json', []); };

module.exports = { getSettings, updateSettings, getEmployees, getLoyaltyCustomers };
