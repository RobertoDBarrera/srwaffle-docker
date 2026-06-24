const fs = require('fs');

function bumpVersion(file) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('theme-manager.js?v=4')) {
    html = html.replace('theme-manager.js?v=4', 'theme-manager.js?v=' + Date.now());
    fs.writeFileSync(file, html);
    console.log('Bumped version in ' + file);
  } else {
    console.log('No v=4 found in ' + file);
  }
}

bumpVersion('index.html');
bumpVersion('admin/index.html');
