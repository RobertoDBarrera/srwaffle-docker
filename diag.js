const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:3000/admin/');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const ids = ['admin-view-analytics', 'admin-view-inventory', 'admin-view-crud-stock', 'admin-view-crud-recipes', 'admin-view-crud-waffles', 'admin-view-crud-menu', 'admin-view-settings', 'admin-view-themes', 'admin-view-developer', 'admin-view-company', 'admin-view-settings-ui', 'admin-view-docs', 'admin-view-empleados'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) console.log('MISSING IN DOM:', id);
    });
  });
  
  await browser.close();
})();
