const { JSDOM } = require('jsdom');

async function testAdmin() {
  try {
    const response = await fetch('http://localhost:3000/admin/');
    const html = await response.text();
    
    const virtualConsole = new (require('jsdom').VirtualConsole)();
    const dom = new JSDOM(html, {
      url: "http://localhost:3000/admin/",
      runScripts: "dangerously",
      resources: "usable",
      virtualConsole
    });

    dom.window.localStorage.setItem('adminToken', 'dummy_token');
    dom.window.sessionStorage.setItem('admin_jwt_token', 'dummy_token');
    dom.window.sessionStorage.setItem('admin_authenticated', 'true');
    dom.window.Chart = class { constructor() {} };

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const doc = dom.window.document;
    const views = doc.querySelectorAll('.admin-view-panel');
    console.log(`Total .admin-view-panel elements: ${views.length}`);
    
    views.forEach(v => {
      console.log(`ID: ${v.id}, Display: ${dom.window.getComputedStyle(v).display}, Active class: ${v.classList.contains('active')}, Height: ${v.clientHeight}, offsetParent: ${!!v.offsetParent}`);
      console.log(`- Parent ID/Class: ${v.parentElement.id} / ${v.parentElement.className}`);
    });
    
    const mainContent = doc.querySelector('.admin-content-area');
    if (mainContent) {
      console.log(`Main Content Area - Display: ${dom.window.getComputedStyle(mainContent).display}, Height: ${mainContent.clientHeight}`);
    }

  } catch (err) {
    console.error("Test failed:", err);
  }
}

testAdmin();
