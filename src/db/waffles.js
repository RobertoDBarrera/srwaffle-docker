const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');

const getWaffles = async () => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM waffles');
    return res.rows.map(r => ({
      id: r.id, name: r.name, description: r.description,
      cost: r.cost, image: r.image,
      ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients
    }));
  }
  return readJSON('waffles.json', []);
};

const getWaffle = async (id) => {
  if (isPostgres()) {
    const res = await pool.query('SELECT * FROM waffles WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id, name: r.name, description: r.description,
      cost: r.cost, image: r.image,
      ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients
    };
  }
  const waffles = readJSON('waffles.json', []);
  return waffles.find(i => i.id === id) || null;
};

const createWaffle = async (item) => {
  item.id = item.id || 'wf_' + Date.now();
  if (isPostgres()) {
    await pool.query(
      'INSERT INTO waffles (id, name, description, cost, image, ingredients) VALUES ($1, $2, $3, $4, $5, $6)',
      [item.id, item.name, item.description || '', item.cost || 0, item.image || '', JSON.stringify(item.ingredients || [])]
    );
  } else {
    const waffles = readJSON('waffles.json', []);
    waffles.push(item);
    writeJSON('waffles.json', waffles);
  }
  return item;
};

const updateWaffle = async (id, item) => {
  if (isPostgres()) {
    await pool.query(
      'UPDATE waffles SET name=$1, description=$2, cost=$3, image=$4, ingredients=$5 WHERE id=$6',
      [item.name, item.description, item.cost, item.image, JSON.stringify(item.ingredients), id]
    );
  } else {
    const waffles = readJSON('waffles.json', []);
    const idx = waffles.findIndex(i => i.id === id);
    if (idx !== -1) {
      waffles[idx] = { ...waffles[idx], ...item };
      writeJSON('waffles.json', waffles);
    }
  }
  return item;
};

const deleteWaffle = async (id) => {
  if (isPostgres()) {
    await pool.query('DELETE FROM waffles WHERE id = $1', [id]);
  } else {
    let waffles = readJSON('waffles.json', []);
    waffles = waffles.filter(i => i.id !== id);
    writeJSON('waffles.json', waffles);
  }
  return { id };
};

module.exports = {
  getWaffles, getWaffle, createWaffle, updateWaffle, deleteWaffle
};
