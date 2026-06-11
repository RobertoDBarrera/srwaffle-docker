const fetch = require('node-fetch');

async function testTracking() {
  console.log("--- Creando venta para trackear ---");
  const saleRes = await fetch('http://localhost:3000/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { id: "test", name: "Waffle Test Tracking", price: 1000, quantity: 1 }
      ],
      total: 1000,
      paymentMethod: 'efectivo',
      cashierName: 'Bot'
    })
  });
  const saleData = await saleRes.json();
  const fullId = saleData.sale.id;
  console.log("Venta creada:", fullId);
  
  const ticketNum = fullId.split('_')[1].slice(-4);
  console.log("Ticket num:", ticketNum);
  
  console.log("--- Probando tracking endpoint ---");
  const trackRes = await fetch(`http://localhost:3000/api/tracking/${ticketNum}`);
  console.log("Status:", trackRes.status);
  const trackData = await trackRes.json();
  console.log("Response:", trackData);
}

testTracking();
