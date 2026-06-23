const fs = require('fs');
const html = fs.readFileSync('admin/index.html', 'utf8');
const views = html.match(/data-admin-view="([^"]+)"/g);
console.log(views);
