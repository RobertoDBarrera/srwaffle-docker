const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');

const getMasas = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM masas');
    return res.rows.map(r => ({
      id: r.id, name: r.name, stock: r.stock, minStock: r.min_stock,
      yield_qty: r.yield_qty, cost_per_portion: r.cost_per_portion,
      ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients
    }));
  }
  return readJSON('masas.json', []);
};

const getMasa = async (id) => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM masas WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id, name: r.name, stock: r.stock, minStock: r.min_stock,
      yield_qty: r.yield_qty, cost_per_portion: r.cost_per_portion,
      ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients
    };
  }
  const masas = readJSON('masas.json', []);
  return masas.find(i => i.id === id) || null;
};

const createMasa = async (item) => {
  item.id = item.id || 'ma_' + Date.now();
  if (isPostgres()) {
    await pool.query(
      'INSERT INTO masas (id, name, stock, min_stock, yield_qty, cost_per_portion, ingredients) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [item.id, item.name, item.stock || 0, item.minStock || 0, item.yield_qty || 1, item.cost_per_portion || 0, JSON.stringify(item.ingredients || [])]
    );
  } else {
    const masas = readJSON('masas.json', []);
    masas.push(item);
    writeJSON('masas.json', masas);
  }
  return item;
};

const updateMasa = async (id, item) => {
  if (isPostgres()) {
    await pool.query(
      'UPDATE masas SET name=COALESCE($1, name), stock=COALESCE($2, stock), min_stock=COALESCE($3, min_stock), yield_qty=COALESCE($4, yield_qty), cost_per_portion=COALESCE($5, cost_per_portion), ingredients=COALESCE($6, ingredients) WHERE id=$7',
      [item.name ?? null, item.stock ?? null, item.minStock ?? null, item.yield_qty ?? null, item.cost_per_portion ?? null, item.ingredients ? JSON.stringify(item.ingredients) : null, id]
    );
  } else {
    const masas = readJSON('masas.json', []);
    const idx = masas.findIndex(i => i.id === id);
    if (idx !== -1) {
      masas[idx] = { ...masas[idx], ...item };
      writeJSON('masas.json', masas);
    }
  }
  return item;
};

const deleteMasa = async (id) => {
  if (isPostgres()) {
    await pool.query('DELETE FROM masas WHERE id = $1', [id]);
  } else {
    let masas = readJSON('masas.json', []);
    masas = masas.filter(i => i.id !== id);
    writeJSON('masas.json', masas);
  }
  return { id };
};

const updateMasaQuantity = async (id, delta) => {
  if (isNaN(delta) || delta === null || delta === undefined) {
    throw new Error('Cantidad inválida para actualizar stock de masa');
  }
  if (isPostgres()) {
    await pool.query('UPDATE masas SET stock = stock + $1 WHERE id = $2', [delta, id]);
  } else {
    const masas = readJSON('masas.json', []);
    const idx = masas.findIndex(i => i.id === id);
    if (idx !== -1) {
      masas[idx].stock += delta;
      writeJSON('masas.json', masas);
    }
  }
};

module.exports = {
  getMasas, getMasa, createMasa, updateMasa, deleteMasa, updateMasaQuantity
};
