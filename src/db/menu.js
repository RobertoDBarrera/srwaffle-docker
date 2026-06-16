const { getPool } = require('./pool');
const { readJsonFile, writeJsonFile } = require('./jsonUtils');

const getMenu = async () => {
  const pool = getPool();
  if (pool) {
    const { rows } = await pool.query('SELECT * FROM menu');
    return rows;
  }
  return await readJsonFile('menu.json', []);
};

const createMenuItem = async (item) => {
  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO menu (id, type, reference_id, name, price, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.id, item.type, item.reference_id, item.name, item.price, item.is_visible]
    );
  } else {
    const data = await readJsonFile('menu.json', []);
    data.push(item);
    await writeJsonFile('menu.json', data);
  }
  return item;
};

const updateMenuItem = async (id, item) => {
  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE menu SET type=$1, reference_id=$2, name=$3, price=$4, is_visible=$5 WHERE id=$6`,
      [item.type, item.reference_id, item.name, item.price, item.is_visible, id]
    );
  } else {
    const data = await readJsonFile('menu.json', []);
    const idx = data.findIndex(d => d.id === id);
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...item };
      await writeJsonFile('menu.json', data);
    }
  }
  return item;
};

const toggleMenuVisible = async (id, is_visible) => {
  const pool = getPool();
  if (pool) {
    await pool.query(`UPDATE menu SET is_visible=$1 WHERE id=$2`, [is_visible, id]);
  } else {
    const data = await readJsonFile('menu.json', []);
    const idx = data.findIndex(d => d.id === id);
    if (idx !== -1) {
      data[idx].is_visible = is_visible;
      await writeJsonFile('menu.json', data);
    }
  }
  return { success: true };
};

const deleteMenuItem = async (id) => {
  const pool = getPool();
  if (pool) {
    await pool.query('DELETE FROM menu WHERE id=$1', [id]);
  } else {
    const data = await readJsonFile('menu.json', []);
    await writeJsonFile('menu.json', data.filter(d => d.id !== id));
  }
  return { success: true };
};

module.exports = {
  getMenu,
  createMenuItem,
  updateMenuItem,
  toggleMenuVisible,
  deleteMenuItem
};
