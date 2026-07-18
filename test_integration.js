const { JSDOM } = require('jsdom');

async function testAdmin() {
  try {
    const response = await fetch('http://localhost:3000/admin/');
    const html = await response.text();
    
    const virtualConsole = new (require('jsdom').VirtualConsole)();
    virtualConsole.on("error", (err) => {
      console.error("JSDOM Error:", err);
    });
    virtualConsole.on("jsdomError", (err) => {
      console.error("JSDOM jsdomError:", err.message);
    });
    virtualConsole.on("log", (msg) => {
      console.log("JSDOM Log:", msg);
    });

    const dom = new JSDOM(html, {
      url: "http://localhost:3000/admin/",
      runScripts: "dangerously",
      resources: "usable",
      virtualConsole
    });

    // Mock global objects that JSDOM doesn't support well
    dom.window.localStorage.setItem('adminToken', 'dummy_token');
    dom.window.sessionStorage.setItem('admin_jwt_token', 'dummy_token');
    dom.window.sessionStorage.setItem('admin_authenticated', 'true');
    dom.window.Chart = class { constructor() {} };

    console.log("Waiting for load...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("Admin Analytics Active:", dom.window.document.getElementById('admin-view-analytics').classList.contains('active'));
    console.log("Analytics innerHTML length:", dom.window.document.getElementById('admin-view-analytics').innerHTML.length);
    
    // Simulate click on Stock
    console.log("Clicking Stock...");
    const stockBtn = dom.window.document.querySelector('[data-admin-view="crud-stock"]');
    if (stockBtn) {
      stockBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Stock Active:", dom.window.document.getElementById('admin-view-crud-stock').classList.contains('active'));
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testAdmin();
