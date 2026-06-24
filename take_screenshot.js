const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    document.body.className = 'is-client-page menu-pos-sidebar';
    // Remove the dev widget so it doesn't block the view
    const widget = document.getElementById('dev-customizer-container');
    if (widget) widget.style.display = 'none';
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'client_sidebar.png' });
  console.log('Screenshot saved to client_sidebar.png');
  
  await browser.close();
})();
