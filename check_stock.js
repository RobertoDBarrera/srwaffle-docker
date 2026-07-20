const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER PAGEERROR:', error.message));
  page.on('dialog', async dialog => {
    console.log('ALERT FOUND:', dialog.message());
    await dialog.dismiss();
  });

  console.log('Navigating to admin...');
  await page.goto('http://localhost:3000/admin/', { waitUntil: 'networkidle0' });
  
  console.log('Logging in...');
  await page.type('#admin-password-input', 'admin');
  await page.click('#admin-login-btn');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Stock (Insumos)...');
  const stockBtn = await page.$('li[data-admin-view="crud-stock"]') || await page.$('div[data-admin-view="crud-stock"]');
  if (stockBtn) {
    await stockBtn.click();
    console.log('Clicked stock. Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Clicking Edit button on first stock item...');
    const editBtn = await page.$('.edit-stock-item-btn');
    if (editBtn) {
      await editBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log('Clicked edit button. Any errors?');
      
      const modalInfo = await page.evaluate(() => {
        const modal = document.getElementById('stock-modal-overlay');
        return modal ? window.getComputedStyle(modal).display : 'null';
      });
      console.log('Stock Edit Modal Display:', modalInfo);
    } else {
      console.log('No edit button found.');
    }
  } else {
    console.log('Stock button not found');
  }
  
  await browser.close();
})();
