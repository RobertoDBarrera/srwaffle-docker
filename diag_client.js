const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 1500));
  
  const state = await page.evaluate(() => {
    const bodyClasses = document.body.className;
    const headerStyle = window.getComputedStyle(document.querySelector('header'));
    return {
      bodyClasses,
      headerWidth: headerStyle.width,
      headerHeight: headerStyle.height,
      headerFlexDirection: headerStyle.flexDirection,
      headerPosition: headerStyle.position,
      hasThemeManager: !!window.applyThemeStyles
    };
  });
  
  console.log('State:', state);
  
  // Try applying theme
  await page.evaluate(() => {
    if (window.applyThemeStyles) {
      window.applyThemeStyles({ layout: { menuPos: 'sidebar' } });
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const newState = await page.evaluate(() => {
    const bodyClasses = document.body.className;
    const headerStyle = window.getComputedStyle(document.querySelector('header'));
    return {
      bodyClasses,
      headerWidth: headerStyle.width,
      headerHeight: headerStyle.height,
      headerFlexDirection: headerStyle.flexDirection,
      headerPosition: headerStyle.position
    };
  });
  
  console.log('After applying theme:', newState);
  
  await browser.close();
})();
