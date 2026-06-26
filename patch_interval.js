const fs = require('fs');

// --- 1. db.js ---
let dbCode = fs.readFileSync('db.js', 'utf8');

if (!dbCode.includes('hero_carousel_interval')) {
  // Add ALTER TABLE
  dbCode = dbCode.replace(
    "await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_carousel_enabled BOOLEAN DEFAULT FALSE;');",
    "await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_carousel_enabled BOOLEAN DEFAULT FALSE;');\n    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_carousel_interval INTEGER DEFAULT 4000;');"
  );
  
  // getCompanyInfo PG
  dbCode = dbCode.replace(
    "SELECT company_name, company_address, company_hours, company_instagram, company_phone, whatsapp_orders_enabled, hero_images, hero_carousel_enabled, map_bg_image, map_pin_x, map_pin_y FROM settings LIMIT 1",
    "SELECT company_name, company_address, company_hours, company_instagram, company_phone, whatsapp_orders_enabled, hero_images, hero_carousel_enabled, hero_carousel_interval, map_bg_image, map_pin_x, map_pin_y FROM settings LIMIT 1"
  );
  
  dbCode = dbCode.replace(
    "heroCarouselEnabled: !!row.hero_carousel_enabled,",
    "heroCarouselEnabled: !!row.hero_carousel_enabled,\n      heroCarouselInterval: row.hero_carousel_interval !== null && row.hero_carousel_interval !== undefined ? row.hero_carousel_interval : 4000,"
  );
  
  // getCompanyInfo JSON
  dbCode = dbCode.replace(
    "heroCarouselEnabled: !!settings.heroCarouselEnabled,",
    "heroCarouselEnabled: !!settings.heroCarouselEnabled,\n      heroCarouselInterval: settings.heroCarouselInterval !== undefined ? settings.heroCarouselInterval : 4000,"
  );
  
  // updateCompanyInfo definition
  dbCode = dbCode.replace(
    "const { companyName, companyAddress, companyHours, companyInstagram, companyPhone, whatsappOrdersEnabled, heroImages, heroCarouselEnabled, mapBgImage, mapPinX, mapPinY, companyLogo, kdsAlertTime } = info;",
    "const { companyName, companyAddress, companyHours, companyInstagram, companyPhone, whatsappOrdersEnabled, heroImages, heroCarouselEnabled, heroCarouselInterval, mapBgImage, mapPinX, mapPinY, companyLogo, kdsAlertTime } = info;"
  );
  
  // updateCompanyInfo PG
  dbCode = dbCode.replace(
    "company_logo = $12, kds_alert_time = $13 WHERE id = 1",
    "company_logo = $12, kds_alert_time = $13, hero_carousel_interval = $14 WHERE id = 1"
  );
  
  dbCode = dbCode.replace(
    "kdsAlertTime !== undefined ? parseInt(kdsAlertTime) : 10",
    "kdsAlertTime !== undefined ? parseInt(kdsAlertTime) : 10,\n        heroCarouselInterval !== undefined ? parseInt(heroCarouselInterval) : 4000"
  );
  
  // updateCompanyInfo JSON
  dbCode = dbCode.replace(
    "if (heroCarouselEnabled !== undefined) settings.heroCarouselEnabled = !!heroCarouselEnabled;",
    "if (heroCarouselEnabled !== undefined) settings.heroCarouselEnabled = !!heroCarouselEnabled;\n    if (heroCarouselInterval !== undefined) settings.heroCarouselInterval = parseInt(heroCarouselInterval);"
  );

  fs.writeFileSync('db.js', dbCode);
  console.log('Patched db.js');
}

// --- 2. server.js ---
let serverCode = fs.readFileSync('server.js', 'utf8');
if (!serverCode.includes('heroCarouselInterval')) {
  serverCode = serverCode.replace(
    "const { companyName, companyAddress, companyHours, companyInstagram, companyPhone, whatsappOrdersEnabled, heroImages, heroCarouselEnabled, mapBgImage, mapPinX, mapPinY, companyLogo, kdsAlertTime } = req.body;",
    "const { companyName, companyAddress, companyHours, companyInstagram, companyPhone, whatsappOrdersEnabled, heroImages, heroCarouselEnabled, heroCarouselInterval, mapBgImage, mapPinX, mapPinY, companyLogo, kdsAlertTime } = req.body;"
  );
  
  serverCode = serverCode.replace(
    "heroCarouselEnabled: heroCarouselEnabled !== undefined ? heroCarouselEnabled : currentInfo.heroCarouselEnabled,",
    "heroCarouselEnabled: heroCarouselEnabled !== undefined ? heroCarouselEnabled : currentInfo.heroCarouselEnabled,\n      heroCarouselInterval: heroCarouselInterval !== undefined ? heroCarouselInterval : currentInfo.heroCarouselInterval,"
  );
  
  fs.writeFileSync('server.js', serverCode);
  console.log('Patched server.js');
}

// --- 3. admin/index.html ---
let adminHtml = fs.readFileSync('admin/index.html', 'utf8');
if (!adminHtml.includes('admin-hero-carousel-interval')) {
  const insertHtml = `
            <div class="form-group" style="margin-top: 10px;">
              <label for="admin-hero-carousel-interval">Tiempo entre imágenes (en segundos)</label>
              <input type="number" id="admin-hero-carousel-interval" class="form-control" value="4" min="1" max="20" style="width: 120px; background:#181818; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:0.5rem;">
            </div>`;
            
  adminHtml = adminHtml.replace(
    '<label for="admin-hero-carousel-toggle">Activar rotación automática (Carrusel)</label>',
    '<label for="admin-hero-carousel-toggle">Activar rotación automática (Carrusel)</label>' + insertHtml
  );
  fs.writeFileSync('admin/index.html', adminHtml);
  console.log('Patched admin/index.html');
}

// --- 4. admin/app.js ---
let adminJs = fs.readFileSync('admin/app.js', 'utf8');
if (!adminJs.includes('admin-hero-carousel-interval')) {
  // loadConfig
  adminJs = adminJs.replace(
    "const carouselToggle = document.getElementById('admin-hero-carousel-toggle');\n      if (carouselToggle) carouselToggle.checked = !!data.heroCarouselEnabled;",
    "const carouselToggle = document.getElementById('admin-hero-carousel-toggle');\n      if (carouselToggle) carouselToggle.checked = !!data.heroCarouselEnabled;\n      const carouselInterval = document.getElementById('admin-hero-carousel-interval');\n      if (carouselInterval) carouselInterval.value = data.heroCarouselInterval ? data.heroCarouselInterval / 1000 : 4;"
  );
  
  // saveConfig
  adminJs = adminJs.replace(
    "const heroCarouselToggle = document.getElementById('admin-hero-carousel-toggle');",
    "const heroCarouselToggle = document.getElementById('admin-hero-carousel-toggle');\n  const heroCarouselInterval = document.getElementById('admin-hero-carousel-interval');"
  );
  
  adminJs = adminJs.replace(
    "heroCarouselEnabled: heroCarouselToggle ? heroCarouselToggle.checked : false",
    "heroCarouselEnabled: heroCarouselToggle ? heroCarouselToggle.checked : false,\n          heroCarouselInterval: heroCarouselInterval ? parseInt(heroCarouselInterval.value) * 1000 : 4000"
  );
  
  fs.writeFileSync('admin/app.js', adminJs);
  console.log('Patched admin/app.js');
}

// --- 5. app.js ---
let appJs = fs.readFileSync('app.js', 'utf8');
if (appJs.includes('}, 4000);')) {
  appJs = appJs.replace('}, 4000);', '}, companyInfo.heroCarouselInterval || 4000);');
  fs.writeFileSync('app.js', appJs);
  console.log('Patched app.js');
}

console.log('Done patching heroCarouselInterval');
