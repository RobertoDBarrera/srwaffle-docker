const puppeteer = require('puppeteer');
const fs = require('fs');

async function captureDOM() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size
  await page.setViewport({ width: 1280, height: 800 });
  
  // Go to the admin page
  await page.goto('http://localhost:3000/admin/');
  
  // Wait for the login form and enter credentials if needed
  try {
    await page.waitForSelector('#admin-password-input', { timeout: 2000 });
    await page.type('#admin-password-input', 'admin123'); // Assuming default
    await page.click('#admin-login-btn');
    await page.waitForTimeout(1000); // Wait for transition
  } catch (e) {
    console.log('No login prompt or failed to login:', e.message);
  }
  
  // Wait for 1 second for any renders
  await page.waitForTimeout(1000);
  
  // Get the FULL outer HTML of the DOM
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('browser_dom.html', html);
  
  // Take a screenshot
  await page.screenshot({ path: 'browser_screenshot.png' });
  
  console.log('DOM captured to browser_dom.html and screenshot to browser_screenshot.png');
  await browser.close();
}

captureDOM().catch(console.error);
