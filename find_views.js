const fs = require('fs');
const html = fs.readFileSync('admin/index.html', 'utf8');
const lines = html.split('\n');
lines.forEach(l => {
  if (l.includes('class="admin-view"')) console.log(l.trim());
});
