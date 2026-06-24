const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:3000/admin/');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(async () => {
    try {
      const themesTab = document.querySelector('[data-admin-view="themes"]');
      if (themesTab) {
        themesTab.click();
        await new Promise(r => setTimeout(r, 1000));
        console.log('themes-default-grid content length:', document.getElementById('themes-default-grid').innerHTML.trim().length);
      } else {
        console.log('Themes tab not found');
      }
    } catch(e) {
      console.log('ERROR:', e.message);
    }
  });
  
  await browser.close();
})();
