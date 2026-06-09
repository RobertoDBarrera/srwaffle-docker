const http = require('http');

const request = (method, path, data) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData || '')
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
};

async function runDeductionsTest() {
  console.log('--- TEST DEDUCCIONES PERSONALIZADAS (RELLENOS Y CREMA) ---');

  // 1. Obtener stock inicial
  console.log('Obteniendo stock inicial...');
  const stockInit = await request('GET', '/api/stock');
  
  const getStockOf = (id) => {
    for (const cat in stockInit) {
      const item = stockInit[cat].find(i => i.id === id);
      if (item) return item.stock;
    }
    return null;
  };

  const nutellaInit = getStockOf('syr_nutella');
  const ddlSpreadInit = getStockOf('syr_dulce_leche_spread');
  const cremaInit = getStockOf('top_crema_batida');
  const baseTradInit = getStockOf('base_tradicional');
  
  console.log(`Stock Inicial -> Tradicional: ${baseTradInit}, Nutella: ${nutellaInit}, Dulce de Leche Relleno: ${ddlSpreadInit}, Crema Batida: ${cremaInit}`);

  // 2. Crear una venta con un waffle customizado
  console.log('Registrando una venta con waffle customizado (Base Tradicional + Relleno Nutella + Crema Batida)...');
  
  const waffleConfig = {
    base: 'base_tradicional',
    toppings: ['top_oreo', 'top_crema_batida'], // top_crema_batida se agrega al compilar
    syrups: ['syr_chocolate', 'syr_nutella'], // syr_nutella se agrega al compilar
    icecreams: ['ice_vainilla']
  };

  const salePayload = {
    items: [
      {
        id: 'custom_test_123',
        name: 'Waffle Customizado',
        details: 'Masa: Tradicional + Relleno: Nutella + Crema Batida + Oreo + Chocolate + Vainilla',
        price: 900,
        type: 'custom_waffle',
        config: waffleConfig
      }
    ],
    total: 900,
    paymentMethod: 'Efectivo'
  };

  const saleResult = await request('POST', '/api/sales', salePayload);
  console.log('Resultado de Venta:', saleResult);

  // 3. Obtener stock final y verificar decremento
  console.log('Obteniendo stock final...');
  const stockFinal = await request('GET', '/api/stock');

  const getStockOfFinal = (id) => {
    for (const cat in stockFinal) {
      const item = stockFinal[cat].find(i => i.id === id);
      if (item) return item.stock;
    }
    return null;
  };

  const nutellaFinal = getStockOfFinal('syr_nutella');
  const cremaFinal = getStockOfFinal('top_crema_batida');
  const baseTradFinal = getStockOfFinal('base_tradicional');

  console.log(`Stock Final -> Tradicional: ${baseTradFinal}, Nutella: ${nutellaFinal}, Crema Batida: ${cremaFinal}`);

  const errors = [];
  if (baseTradInit - baseTradFinal !== 1) errors.push('Base Tradicional no descontó correctamente');
  if (nutellaInit - nutellaFinal !== 1) errors.push('Nutella no descontó correctamente');
  if (cremaInit - cremaFinal !== 1) errors.push('Crema Batida no descontó correctamente');

  if (errors.length > 0) {
    console.error('❌ PRUEBA FALLIDA:', errors);
  } else {
    console.log('✅ PRUEBA EXITOSA: Todos los insumos se descontaron correctamente en 1 unidad!');
  }
}

runDeductionsTest().catch(console.error);
