const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:3000/admin/');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(async () => {
    try {
      console.log('DOM admin-view-themes exists?', !!document.getElementById('admin-view-themes'));
      console.log('loadThemesGallery exists?', typeof loadThemesGallery);
      if (typeof loadThemesGallery === 'function') {
        console.log('Calling loadThemesGallery...');
        await loadThemesGallery();
        console.log('themes-default-grid content:', document.getElementById('themes-default-grid').innerHTML.trim().length > 0 ? 'HAS CONTENT' : 'EMPTY');
      }
    } catch(e) {
      console.log('ERROR:', e.message);
    }
  });
  
  await browser.close();
})();
