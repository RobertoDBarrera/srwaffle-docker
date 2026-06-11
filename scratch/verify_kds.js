const fetch = require('node-fetch');

(async () => {
  try {
    console.log('--- Creando empleado cocinero ---');
    const empRes = await fetch('http://localhost:3000/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Chef Gordon', pin: '4321', role: 'kitchen', active: true })
    });
    console.log('Status:', empRes.status);
    const empResText = await empRes.text();
    console.log('Response:', empResText);
    const empData = JSON.parse(empResText);
    console.log('Cocinero:', empData);

    console.log('--- Creando venta ---');
    const saleRes = await fetch('http://localhost:3000/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { name: 'Waffle Personalizado', qty: 1, price: 5000, details: 'Base Clásica\nNutella, Frutilla\nHelado Vainilla' }
        ],
        total: 5000,
        paymentMethod: 'efectivo',
        cashierName: 'Cajero Test'
      })
    });
    const saleData = await saleRes.json();
    console.log('Venta:', saleData);

    console.log('--- Obteniendo tickets de cocina ---');
    const tixRes = await fetch('http://localhost:3000/api/kitchen/tickets');
    const tickets = await tixRes.json();
    console.log(`Hay ${tickets.length} tickets en cocina.`);
    if (tickets.length > 0) {
      console.log('Último ticket:', tickets[0].kdsStatus, tickets[0].items[0].name);
    }
  } catch(e) {
    console.error(e);
  }
})();
