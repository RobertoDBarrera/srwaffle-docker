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

const getEmployees = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM employees ORDER BY name');
    return res.rows;
  }
  return readJSON('employees.json', []);
};
const createEmployee = async (emp) => {
  emp.id = emp.id || 'emp_' + Date.now();
  if (isPostgres()) {
    await pool.query('INSERT INTO employees (id, name, pin, role, active) VALUES ($1, $2, $3, $4, $5)', [emp.id, emp.name, emp.pin, emp.role, emp.active ?? true]);
    return emp;
  }
  const list = await getEmployees();
  list.push(emp);
  writeJSON('employees.json', list);
  return emp;
};
const updateEmployee = async (id, data) => {
  if (isPostgres()) {
    await pool.query('UPDATE employees SET name = COALESCE($1, name), pin = COALESCE($2, pin), role = COALESCE($3, role), active = COALESCE($4, active) WHERE id = $5', [data.name, data.pin, data.role, data.active, id]);
    return;
  }
  const list = await getEmployees();
  const idx = list.findIndex(e=>e.id===id);
  if(idx!==-1){ list[idx]={...list[idx], ...data}; writeJSON('employees.json', list); }
};
const deleteEmployee = async (id) => {
  if (isPostgres()) {
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    return;
  }
  const list = await getEmployees();
  const filtered = list.filter(e=>e.id!==id);
  writeJSON('employees.json', filtered);
};

const getCompanyInfo = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
    if (res.rows.length === 0) return {};
    const r = res.rows[0];
    const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
    return data || {};
  }
  return readJSON('company.json', { companyName: 'Sr. Waffle', companyAddress: '...', companyHours: '...', companyInstagram: '', companyPhone: '', whatsappOrdersEnabled: false, kdsAlertTime: 10, paymentMethods: [{name: 'Efectivo', enabled: true}, {name: 'Tarjeta de Débito', enabled: true}, {name: 'Tarjeta de Crédito', enabled: true}, {name: 'Mercado Pago', enabled: false}] });
};
const updateCompanyInfo = async (data) => {
  if (isPostgres()) {
    const current = await getCompanyInfo();
    const newData = { ...current, ...data };
    await pool.query('UPDATE settings SET data = $1', [JSON.stringify(newData)]);
    return;
  }
  const current = await getCompanyInfo();
  writeJSON('company.json', { ...current, ...data });
};
const getLoyaltyCustomers = async () => { return readJSON('loyalty.json', []); };

module.exports = { getSettings, updateSettings, getEmployees, createEmployee, updateEmployee, deleteEmployee, getCompanyInfo, updateCompanyInfo, getLoyaltyCustomers };
