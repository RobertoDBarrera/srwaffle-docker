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
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
};

async function runHeladosTests() {
  console.log('--- INICIANDO PRUEBAS DE HELADOS Y STOCK ---');

  // 1. Crear nuevo sabor de helado en stock
  console.log('\n1. Creando sabor de helado "Helado de Sambayón" en stock:');
  const iceCreamCreate = await request('POST', '/api/stock', {
    name: 'Helado de Sambayón',
    category: 'icecreams',
    stock: 40,
    minStock: 5,
    price: 180,
    unit: 'bochas'
  });
  console.log('Respuesta:', iceCreamCreate);
  if (iceCreamCreate.statusCode !== 200) {
    throw new Error('Error al crear helado');
  }
  const createdIceId = iceCreamCreate.data.item.id;

  // 2. Crear waffle de carta con helado por defecto
  console.log('\n2. Creando Waffle de Carta "Waffle del Bosque Helado" con Helado de Sambayón por defecto:');
  const waffleCreate = await request('POST', '/api/menu', {
    name: 'Waffle del Bosque Helado',
    description: 'Waffle caliente con crema y helado de sambayón',
    price: 1500,
    base: 'base_tradicional',
    toppings: ['top_frutilla'],
    syrups: ['syr_chocolate'],
    icecreams: [createdIceId],
    image: ''
  });
  console.log('Respuesta:', waffleCreate);
  if (waffleCreate.statusCode !== 200) {
    throw new Error('Error al crear waffle del menú');
  }
  const createdWaffleId = waffleCreate.data.item.id;

  // 3. Verificar stock actual del helado antes de la venta
  console.log('\n3. Verificando stock inicial de helado de sambayón:');
  const stockRes1 = await request('GET', '/api/stock');
  const sambayonStockItem1 = stockRes1.data.icecreams.find(i => i.id === createdIceId);
  console.log('Stock inicial:', sambayonStockItem1);
  const initialStock = sambayonStockItem1.stock;

  // 4. Registrar una venta de este Waffle de Carta (debería descontar stock de base, toppings, syrups e icecreams)
  console.log('\n4. Registrando venta del waffle con helado por defecto:');
  const saleRes = await request('POST', '/api/sales', {
    items: [
      {
        name: 'Waffle del Bosque Helado',
        details: 'Masa Tradicional + Frutillas Frescas + Salsa de Chocolate + Helado de Sambayón',
        price: 1500,
        type: 'menu_waffle',
        config: {
          base: 'base_tradicional',
          toppings: ['top_frutilla'],
          syrups: ['syr_chocolate'],
          icecreams: [createdIceId]
        }
      }
    ],
    total: 1500,
    paymentMethod: 'Efectivo'
  });
  console.log('Respuesta Venta:', saleRes);
  if (saleRes.statusCode !== 200) {
    throw new Error('Error al registrar venta');
  }
  const createdSaleId = saleRes.data.sale.id;

  // 5. Verificar stock después de la venta (debería ser initialStock - 1)
  console.log('\n5. Verificando stock tras la venta:');
  const stockRes2 = await request('GET', '/api/stock');
  const sambayonStockItem2 = stockRes2.data.icecreams.find(i => i.id === createdIceId);
  console.log('Stock después de venta:', sambayonStockItem2);
  if (sambayonStockItem2.stock !== initialStock - 1) {
    console.error(`ERROR: El stock debería ser ${initialStock - 1} pero es ${sambayonStockItem2.stock}`);
  } else {
    console.log('¡Deducción de stock de helado exitosa!');
  }

  // 6. Reembolsar la venta (debería restituir stock)
  console.log('\n6. Reembolsando la venta realizada:');
  const refundRes = await request('POST', '/api/sales/refund', { saleId: createdSaleId });
  console.log('Respuesta Reembolso:', refundRes);
  if (refundRes.statusCode !== 200) {
    throw new Error('Error al realizar reembolso');
  }

  // 7. Verificar stock después del reembolso (debería volver a initialStock)
  console.log('\n7. Verificando stock tras el reembolso:');
  const stockRes3 = await request('GET', '/api/stock');
  const sambayonStockItem3 = stockRes3.data.icecreams.find(i => i.id === createdIceId);
  console.log('Stock después de reembolso:', sambayonStockItem3);
  if (sambayonStockItem3.stock !== initialStock) {
    console.error(`ERROR: El stock debería ser ${initialStock} pero es ${sambayonStockItem3.stock}`);
  } else {
    console.log('¡Restitución de stock de helado exitosa!');
  }

  // 8. Limpieza de elementos de prueba
  console.log('\n8. Eliminando Waffle de prueba y sabor de helado de prueba:');
  const delWaffle = await request('DELETE', `/api/menu/${createdWaffleId}`);
  console.log('Eliminar Waffle:', delWaffle.statusCode);
  const delStock = await request('DELETE', `/api/stock/${createdIceId}`);
  console.log('Eliminar Helado de Stock:', delStock.statusCode);

  console.log('\n--- PRUEBAS FINALIZADAS CON ÉXITO ---');
}

runHeladosTests().catch(err => {
  console.error('Error durante la ejecución de pruebas:', err);
});
