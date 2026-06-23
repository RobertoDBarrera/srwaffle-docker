const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/admin/');
  console.log('Page loaded');
  
  // Try logging in
  await page.type('#admin-password-input', 'adminpassword');
  await page.click('#admin-login-btn');
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Logged in, waiting for data...');
  
  // Click around
  try {
    await page.evaluate(() => document.querySelector('[data-admin-view="empleados"]').click());
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.querySelector('[data-admin-view="crud-waffles"]').click());
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.querySelector('[data-admin-view="crud-menu"]').click());
  } catch (e) {
    console.log('Error clicking:', e.message);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
