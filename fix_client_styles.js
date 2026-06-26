const fs = require('fs');

// 1. Fix body class in index.html
let html = fs.readFileSync('index.html', 'utf8');
if (html.includes('<body>')) {
  html = html.replace('<body>', '<body class="is-client-page">');
  // Bump cache
  html = html.replace(/theme-manager\.js\?v=\d+/, 'theme-manager.js?v=' + Date.now());
  fs.writeFileSync('index.html', html);
  console.log('Fixed index.html body class');
} else if (html.includes('<body class="is-client-page">')) {
  console.log('Body class already fixed');
}

// 2. Fix admin/app.js to say "Clonar"
let adminJs = fs.readFileSync('admin/app.js', 'utf8');
if (adminJs.includes('window.editThemePreset(\\'${preset.id}\\')\">Editar</button>')) {
  adminJs = adminJs.replace(
    'window.editThemePreset(\\'${preset.id}\\')\">Editar</button>',
    'window.editThemePreset(\\'${preset.id}\\')\">${preset.id.startsWith(\\'default_\\') ? \\'Clonar\\' : \\'Editar\\'}</button>'
  );
  fs.writeFileSync('admin/app.js', adminJs);
  console.log('Fixed admin button text');
}

// Bump admin index cache
let adminHtml = fs.readFileSync('admin/index.html', 'utf8');
adminHtml = adminHtml.replace(/app\.js\?v=\d+/, 'app.js?v=' + Date.now());
fs.writeFileSync('admin/index.html', adminHtml);
console.log('Bumped admin index cache');
