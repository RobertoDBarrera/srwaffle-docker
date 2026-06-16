const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');

const getSales = async (limit = 100) => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM sales ORDER BY date DESC LIMIT $1', [limit]);
    return res.rows.map(r => ({
      id: r.id, date: r.date, items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      total: r.total, paymentMethod: r.payment_method, status: r.status, cashierName: r.cashier_name
    }));
  }
  const sales = readJSON('sales.json', []);
  return sales.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
};

const createSale = async (sale) => {
  if (isPostgres()) {
    await pool.query(
      'INSERT INTO sales (id, date, items, total, payment_method, status, cashier_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [sale.id, sale.date, JSON.stringify(sale.items), sale.total, sale.paymentMethod, sale.status || 'completed', sale.cashierName]
    );
  } else {
    const sales = readJSON('sales.json', []);
    sales.push(sale);
    writeJSON('sales.json', sales);
  }
  return sale;
};

const updateSaleStatus = async (id, status) => {
  if (isPostgres()) {
    await pool.query('UPDATE sales SET status = $1 WHERE id = $2', [status, id]);
  } else {
    const sales = readJSON('sales.json', []);
    const s = sales.find(i => i.id === id);
    if (s) { s.status = status; writeJSON('sales.json', sales); }
  }
};

module.exports = { getSales, createSale, updateSaleStatus };
