// Datos iniciales por defecto para Sr. Waffle
const INITIAL_STOCK = {
  // Masas (Bases)
  bases: [
    { id: 'base_tradicional', name: 'Masa Tradicional', category: 'bases', stock: 120, minStock: 20, price: 450, unit: 'porciones' },
    { id: 'base_chocolate', name: 'Masa de Chocolate', category: 'bases', stock: 95, minStock: 20, price: 500, unit: 'porciones' },
    { id: 'base_red_velvet', name: 'Masa Red Velvet', category: 'bases', stock: 45, minStock: 15, price: 550, unit: 'porciones' }
  ],
  // Toppings
  toppings: [
    { id: 'top_oreo', name: 'Galletitas Oreo', category: 'toppings', stock: 85, minStock: 15, price: 120, unit: 'porciones' },
    { id: 'top_kitkat', name: 'KitKat Troceado', category: 'toppings', stock: 60, minStock: 15, price: 160, unit: 'porciones' },
    { id: 'top_frutilla', name: 'Frutillas Frescas', category: 'toppings', stock: 8, minStock: 10, price: 180, unit: 'porciones' }, // Puesto bajo a propósito para probar alertas
    { id: 'top_chips', name: 'Chips de Chocolate', category: 'toppings', stock: 150, minStock: 25, price: 90, unit: 'porciones' },
    { id: 'top_marshmallows', name: 'Marshmallows', category: 'toppings', stock: 75, minStock: 12, price: 100, unit: 'porciones' },
    { id: 'top_rocklets', name: 'Rocklets', category: 'toppings', stock: 90, minStock: 15, price: 110, unit: 'porciones' },
    { id: 'top_nuez', name: 'Nueces Picadas', category: 'toppings', stock: 40, minStock: 10, price: 140, unit: 'porciones' }
  ],
  // Salsas
  syrups: [
    { id: 'syr_chocolate', name: 'Salsa de Chocolate', category: 'syrups', stock: 150, minStock: 30, price: 80, unit: 'porciones' },
    { id: 'syr_dulce_leche', name: 'Dulce de Leche', category: 'syrups', stock: 180, minStock: 40, price: 90, unit: 'porciones' },
    { id: 'syr_caramelo', name: 'Salsa de Caramelo', category: 'syrups', stock: 95, minStock: 20, price: 80, unit: 'porciones' }
  ],
  // Bebidas
  drinks: [
    { id: 'drink_agua', name: 'Agua Mineral (500ml)', category: 'drinks', stock: 45, minStock: 10, price: 250, unit: 'unidades' },
    { id: 'drink_cola', name: 'Gaseosa Cola (Lata)', category: 'drinks', stock: 50, minStock: 12, price: 300, unit: 'unidades' },
    { id: 'drink_jugo', name: 'Jugo Naranja (Exprimido)', category: 'drinks', stock: 18, minStock: 8, price: 380, unit: 'unidades' }
  ]
};

const INITIAL_MENU = [
  {
    id: 'menu_choco_loco',
    name: 'Chocolate Loco',
    description: 'Waffle con masa de chocolate, cubierto con salsa de chocolate, trozos de KitKat y chips de chocolate blanco y negro.',
    price: 850,
    base: 'base_chocolate',
    toppings: ['top_kitkat', 'top_chips'],
    syrups: ['syr_chocolate'],
    image: 'ima_loc533.jpeg' // Usará la imagen con cartel neón de fondo
  },
  {
    id: 'menu_patagonia_frutilla',
    name: 'Bosque Patagónico',
    description: 'Masa tradicional dorada, coronada con frutillas frescas de estación, crema batida y abundante salsa de dulce de leche.',
    price: 900,
    base: 'base_tradicional',
    toppings: ['top_frutilla'],
    syrups: ['syr_dulce_leche'],
    image: 'ima_loc532.jpeg' // Kiosco principal
  },
  {
    id: 'menu_tentacion_oreo',
    name: 'Tentación Oreo',
    description: 'Waffle tradicional con galletitas Oreo trituradas, chips de chocolate, bañado en dulce de leche y salsa de chocolate.',
    price: 880,
    base: 'base_tradicional',
    toppings: ['top_oreo', 'top_chips'],
    syrups: ['syr_dulce_leche', 'syr_chocolate'],
    image: 'ima_loc534.jpeg' // Toppings bar close-up
  }
];

// Ventas simuladas para rellenar las estadísticas e historial al cargar por primera vez
const getMockSales = () => {
  const sales = [];
  const paymentMethods = ['Efectivo', 'Tarjeta de Débito', 'Mercado Pago'];
  const now = new Date();
  
  // Generar 18 ventas mock para los últimos 3 días
  for (let i = 18; i > 0; i--) {
    const saleDate = new Date(now.getTime() - i * 4 * 60 * 60 * 1000); // Espaciadas cada 4 horas
    
    // Elegir aleatoriamente qué compraron
    const isCustom = Math.random() > 0.4;
    let items = [];
    let total = 0;
    
    if (isCustom) {
      // Waffle personalizado
      const basePrice = 450 + (Math.random() > 0.5 ? 50 : 0);
      const topCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 toppings
      const topPrices = topCount * 120;
      const syrCount = Math.floor(Math.random() * 2) + 1; // 1 to 2 syrups
      const syrPrices = syrCount * 80;
      
      total = basePrice + topPrices + syrPrices;
      items.push({
        name: 'Waffle Personalizado',
        details: `${topCount} Toppings, ${syrCount} Salsas`,
        price: total
      });
    } else {
      // Waffle del menú
      const menuItem = INITIAL_MENU[Math.floor(Math.random() * INITIAL_MENU.length)];
      total = menuItem.price;
      items.push({
        name: menuItem.name,
        details: 'Waffle del Menú',
        price: total
      });
    }
    
    // Posibilidad de agregar una bebida
    if (Math.random() > 0.5) {
      const drink = INITIAL_STOCK.drinks[Math.floor(Math.random() * INITIAL_STOCK.drinks.length)];
      total += drink.price;
      items.push({
        name: drink.name,
        details: 'Bebida',
        price: drink.price
      });
    }
    
    sales.push({
      id: `sale_${1000 + i}`,
      date: saleDate.toISOString(),
      items: items,
      total: total,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: 'completed'
    });
  }
  
  return sales;
};

// Exportar al objeto global de la ventana en el navegador
window.SrWaffleData = {
  INITIAL_STOCK,
  INITIAL_MENU,
  INITIAL_SALES: getMockSales()
};
