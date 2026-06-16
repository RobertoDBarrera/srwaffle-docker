const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');

const getStock = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM stock');
    return res.rows.map(r => ({
      id: r.id, name: r.name, category: r.category,
      stock: r.stock, minStock: r.min_stock, unit: r.unit,
      cost: r.cost, portion_size: r.portion_size, price_per_portion: r.price_per_portion
    }));
  }
  return readJSON('stock.json', []);
};

const getStockItem = async (id) => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM stock WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id, name: r.name, category: r.category,
      stock: r.stock, minStock: r.min_stock, unit: r.unit,
      cost: r.cost, portion_size: r.portion_size, price_per_portion: r.price_per_portion
    };
  }
  const stock = readJSON('stock.json', []);
  return stock.find(i => i.id === id) || null;
};

const createStockItem = async (item) => {
  if (isPostgres()) {
    await pool.query(
      'INSERT INTO stock (id, name, category, stock, min_stock, unit, cost, portion_size, price_per_portion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [item.id, item.name, item.category, item.stock || 0, item.minStock || 0, item.unit || 'g', item.cost || 0, item.portion_size || 0, item.price_per_portion || 0]
    );
  } else {
    const stock = readJSON('stock.json', []);
    stock.push(item);
    writeJSON('stock.json', stock);
  }
  return item;
};

const updateStockItem = async (id, item) => {
  if (isPostgres()) {
    await pool.query(
      'UPDATE stock SET name=$1, category=$2, stock=$3, min_stock=$4, unit=$5, cost=$6, portion_size=$7, price_per_portion=$8 WHERE id=$9',
      [item.name, item.category, item.stock, item.minStock, item.unit, item.cost, item.portion_size, item.price_per_portion, id]
    );
  } else {
    const stock = readJSON('stock.json', []);
    const idx = stock.findIndex(i => i.id === id);
    if (idx !== -1) {
      stock[idx] = { ...stock[idx], ...item };
      writeJSON('stock.json', stock);
    }
  }
  return item;
};

const deleteStockItem = async (id) => {
  if (isPostgres()) {
    await pool.query('DELETE FROM stock WHERE id = $1', [id]);
  } else {
    let stock = readJSON('stock.json', []);
    stock = stock.filter(i => i.id !== id);
    writeJSON('stock.json', stock);
  }
  return { id };
};

const updateStockQuantity = async (id, delta) => {
  if (isPostgres()) {
    await pool.query('UPDATE stock SET stock = stock + $1 WHERE id = $2', [delta, id]);
  } else {
    const stock = readJSON('stock.json', []);
    const idx = stock.findIndex(i => i.id === id);
    if (idx !== -1) {
      stock[idx].stock += delta;
      writeJSON('stock.json', stock);
    }
  }
};

module.exports = {
  getStock, getStockItem, createStockItem, updateStockItem, deleteStockItem, updateStockQuantity
};
