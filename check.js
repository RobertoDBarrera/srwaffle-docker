const fs = require('fs');
const html = fs.readFileSync('admin/index.html', 'utf8');
const ids = ['admin-view-analytics', 'admin-view-inventory', 'admin-view-crud-stock', 'admin-view-crud-recipes', 'admin-view-crud-waffles', 'admin-view-crud-menu', 'admin-view-settings', 'admin-view-themes', 'admin-view-developer', 'admin-view-company', 'admin-view-settings-ui', 'admin-view-docs', 'admin-view-empleados'];
for (const id of ids) {
  if (html.indexOf('id="' + id + '"') === -1) {
    console.log('Missing:', id);
  }
}
