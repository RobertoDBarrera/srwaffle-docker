const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');

const getSales = async (limit = 100) => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM sales ORDER BY date DESC LIMIT $1', [limit]);
    return res.rows.map(r => ({
      id: r.id, date: r.date, items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      total: r.total, paymentMethod: r.payment_method, status: r.status, cashierName: r.cashier_name,
      kdsStatus: r.kdsStatus || r.status,
      kdsCompletedAt: r.kds_completed_at,
      customerName: r.customer_name
    }));
  }
  const sales = readJSON('sales.json', []);
  return sales.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
};

const createSale = async (sale) => {
  if (isPostgres()) {
    await pool.query(
      'INSERT INTO sales (id, date, items, total, payment_method, status, cashier_name, "kdsStatus") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [sale.id, sale.date, JSON.stringify(sale.items), sale.total, sale.paymentMethod, sale.status || 'completed', sale.cashierName, sale.kdsStatus || 'pending']
    );
  } else {
    const sales = readJSON('sales.json', []);
    sales.push(sale);
    writeJSON('sales.json', sales);
  }
  return sale;
};

const getSaleById = async (saleId) => {
  const withPrefix = saleId.startsWith('sale_') ? saleId : `sale_${saleId}`;
  const withoutPrefix = saleId.startsWith('sale_') ? saleId.replace('sale_', '') : saleId;
  
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM sales WHERE id = $1 OR id = $2', [withPrefix, withoutPrefix]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      date: row.date.toISOString ? row.date.toISOString() : row.date,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      total: row.total,
      paymentMethod: row.payment_method,
      status: row.status,
      cashierName: row.cashier_name || 'Administrador',
      kdsStatus: row.kdsStatus || row.status,
      kdsCompletedAt: row.kds_completed_at
    };
  } else {
    const sales = readJSON('sales.json', []);
    return sales.find(s => s.id === withPrefix || s.id === withoutPrefix) || null;
  }
};

const getKitchenTickets = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM sales WHERE "kdsStatus" IN (\'pending\', \'preparing\', \'ready\') ORDER BY date ASC');
    return res.rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      kdsStatus: row.kdsStatus || row.status,
      kdsCompletedAt: row.kds_completed_at
    }));
  } else {
    const sales = readJSON('sales.json', []);
    return sales.filter(s => s.kdsStatus === 'pending' || s.kdsStatus === 'preparing' || s.kdsStatus === 'ready').reverse();
  }
};

const updateKitchenTicketStatus = async (saleId, status) => {
  const isCompleted = status === 'ready' || status === 'delivered';
  if (isPostgres()) {
    if (isCompleted) {
      await pool.query('UPDATE sales SET "kdsStatus" = $1, kds_completed_at = CURRENT_TIMESTAMP WHERE id = $2 AND kds_completed_at IS NULL', [status, saleId]);
      await pool.query('UPDATE sales SET "kdsStatus" = $1 WHERE id = $2', [status, saleId]);
    } else {
      await pool.query('UPDATE sales SET "kdsStatus" = $1 WHERE id = $2', [status, saleId]);
    }
  } else {
    const sales = readJSON('sales.json', []);
    const s = sales.find(i => i.id === saleId);
    if (s) {
      s.kdsStatus = status;
      if (isCompleted && !s.kdsCompletedAt) s.kdsCompletedAt = new Date().toISOString();
      writeJSON('sales.json', sales);
    }
  }
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

const getReviews = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    return res.rows;
  } else {
    return readJSON('reviews.json', []);
  }
};

const addReview = async (saleId, rating, comment) => {
  if (isPostgres()) {
    const res = await pool.query(
      'INSERT INTO reviews (sale_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
      [saleId, rating, comment]
    );
    return res.rows[0];
  } else {
    const reviews = readJSON('reviews.json', []);
    const newReview = {
      id: Date.now(),
      sale_id: saleId,
      rating,
      comment,
      created_at: new Date().toISOString()
    };
    reviews.push(newReview);
    writeJSON('reviews.json', reviews);
    return newReview;
  }
};

const createKioskOrder = async (id, cart) => {
  if (isPostgres()) {
    await pool.query('INSERT INTO kiosk_orders (id, cart) VALUES ($1, $2)', [id, JSON.stringify(cart)]);
  } else {
    const orders = readJSON('kiosk_orders.json', []);
    orders.push({ id, cart, created_at: new Date().toISOString() });
    writeJSON('kiosk_orders.json', orders);
  }
};

const getKioskOrder = async (id) => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM kiosk_orders WHERE id = $1', [id]);
    if (res.rows.length > 0) return res.rows[0];
    return null;
  } else {
    const orders = readJSON('kiosk_orders.json', []);
    return orders.find(o => o.id === id) || null;
  }
};

const deleteKioskOrder = async (id) => {
  if (isPostgres()) {
    await pool.query('DELETE FROM kiosk_orders WHERE id = $1', [id]);
  } else {
    const orders = readJSON('kiosk_orders.json', []);
    writeJSON('kiosk_orders.json', orders.filter(o => o.id !== id));
  }
};

module.exports = { 
  getSales, 
  createSale, 
  updateSaleStatus, 
  getSaleById, 
  getKitchenTickets, 
  updateKitchenTicketStatus, 
  getReviews, 
  addReview,
  createKioskOrder,
  getKioskOrder,
  deleteKioskOrder
};
