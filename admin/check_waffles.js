const fs = require('fs');
const html = fs.readFileSync('admin/index.html', 'utf8');
const waffStart = html.indexOf('id="admin-view-crud-waffles"');
if (waffStart !== -1) {
  console.log('waffles html:', html.substring(waffStart, waffStart + 500));
} else {
  console.log('admin-view-crud-waffles not found');
}
