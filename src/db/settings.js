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
const createEmployee = async (emp) => { const list = await getEmployees(); list.push(emp); writeJSON('employees.json', list); return emp; };
const updateEmployee = async (id, data) => { const list = await getEmployees(); const idx = list.findIndex(e=>e.id===id); if(idx!==-1){ list[idx]={...list[idx], ...data}; writeJSON('employees.json', list); } };
const deleteEmployee = async (id) => { const list = await getEmployees(); const filtered = list.filter(e=>e.id!==id); writeJSON('employees.json', filtered); };

const getCompanyInfo = async () => { return readJSON('company.json', { companyName: 'Sr. Waffle', companyAddress: '...', companyHours: '...', companyInstagram: '', companyPhone: '', whatsappOrdersEnabled: false, kdsAlertTime: 10 }); };
const updateCompanyInfo = async (data) => { const current = await getCompanyInfo(); writeJSON('company.json', { ...current, ...data }); };

const getLoyaltyCustomers = async () => { return readJSON('loyalty_customers.json', []); };

module.exports = { getSettings, updateSettings, getEmployees, createEmployee, updateEmployee, deleteEmployee, getCompanyInfo, updateCompanyInfo, getLoyaltyCustomers };
