const fs = require('fs');
let html = fs.readFileSync('admin/index.html', 'utf8');

if (html.includes('id="admin-view-themes" style="display: none;"')) {
  html = html.replace('id="admin-view-themes" style="display: none;"', 'id="admin-view-themes"');
  fs.writeFileSync('admin/index.html', html);
  console.log('Removed display: none inline style from admin-view-themes');
} else {
  console.log('Style not found');
}
