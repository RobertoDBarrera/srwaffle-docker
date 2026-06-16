const INITIAL_STOCK = [
  { id: 'stk_harina', name: 'Harina Trigo 0000', category: 'raw_material', stock: 10000, minStock: 2000, unit: 'g', cost: 1500, portion_size: 0, price_per_portion: 0 },
  { id: 'stk_huevo', name: 'Huevos', category: 'raw_material', stock: 120, minStock: 30, unit: 'unidades', cost: 150, portion_size: 0, price_per_portion: 0 },
  { id: 'stk_leche', name: 'Leche Entera', category: 'raw_material', stock: 5000, minStock: 1000, unit: 'ml', cost: 1200, portion_size: 0, price_per_portion: 0 },
  { id: 'stk_oreo', name: 'Galletitas Oreo', category: 'topping', stock: 2000, minStock: 500, unit: 'g', cost: 8000, portion_size: 30, price_per_portion: 120 },
  { id: 'stk_frutilla', name: 'Frutillas Frescas', category: 'topping', stock: 1500, minStock: 300, unit: 'g', cost: 5000, portion_size: 40, price_per_portion: 180 },
  { id: 'stk_syr_chocolate', name: 'Salsa de Chocolate', category: 'syrup', stock: 3000, minStock: 500, unit: 'ml', cost: 4000, portion_size: 20, price_per_portion: 80 },
  { id: 'stk_coca', name: 'Coca Cola Lata', category: 'drink', stock: 50, minStock: 12, unit: 'unidades', cost: 500, portion_size: 1, price_per_portion: 1000 }
];

const INITIAL_MASAS = [
  { 
    id: 'masa_tradicional', 
    name: 'Masa Tradicional', 
    stock: 120, 
    minStock: 20, 
    yield_qty: 20, 
    cost_per_portion: 450,
    ingredients: [
      { stock_id: 'stk_harina', qty: 1000 },
      { stock_id: 'stk_huevo', qty: 5 },
      { stock_id: 'stk_leche', qty: 500 }
    ]
  }
];

const INITIAL_WAFFLES = [
  {
    id: 'waf_tentacion_oreo',
    name: 'Tentación Oreo',
    description: 'Waffle tradicional con Oreo y salsa chocolate',
    cost: 500,
    image: 'ima_loc534.jpeg',
    ingredients: [
      { type: 'masa', id: 'masa_tradicional', qty: 1 },
      { type: 'stock', id: 'stk_oreo', qty: 30 },
      { type: 'stock', id: 'stk_syr_chocolate', qty: 20 }
    ]
  }
];

const INITIAL_MENU = [
  {
    id: 'menu_waffle_tentacion',
    type: 'waffle',
    reference_id: 'waf_tentacion_oreo',
    name: 'Tentación Oreo',
    price: 4500,
    is_visible: true
  },
  {
    id: 'menu_drink_coca',
    type: 'direct',
    reference_id: 'stk_coca',
    name: 'Coca Cola Lata',
    price: 1500,
    is_visible: true
  }
];

const INITIAL_SETTINGS = { adminPassword: 'admin', currency: 'ARS', ticketFooter: '¡Gracias por su compra!' };

module.exports = {
  INITIAL_STOCK,
  INITIAL_MASAS,
  INITIAL_WAFFLES,
  INITIAL_MENU,
  INITIAL_SETTINGS
};
