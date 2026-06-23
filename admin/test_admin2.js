const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/admin/');
  console.log('Page loaded');
  
  await page.type('#admin-password-input', 'adminpassword');
  await page.click('#admin-login-btn');
  await new Promise(r => setTimeout(r, 2000));
  
  // Test Empleados
  console.log('Clicking Empleados tab...');
  await page.evaluate(() => document.querySelector('[data-admin-view="empleados"]').click());
  await new Promise(r => setTimeout(r, 500));
  
  console.log('Clicking Nuevo Empleado button...');
  await page.evaluate(() => document.getElementById('btn-add-employee').click());
  await new Promise(r => setTimeout(r, 500));
  
  const modalVisible = await page.evaluate(() => document.getElementById('employee-modal').style.display !== 'none');
  console.log('Employee modal visible:', modalVisible);
  
  // Test Dev Module
  console.log('Clicking Módulo Dev tab...');
  await page.evaluate(() => document.querySelector('[data-admin-view="developer"]').click());
  await new Promise(r => setTimeout(r, 500));
  
  console.log('Clicking Developer Toggle...');
  await page.evaluate(() => document.getElementById('developer-toggle').click());
  await new Promise(r => setTimeout(r, 1000));
  
  const devStatus = await page.evaluate(() => document.getElementById('developer-status-badge').textContent);
  console.log('Dev Status:', devStatus);
  
  await browser.close();
})();
