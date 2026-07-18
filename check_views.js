const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('admin/index.html', 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const views = doc.querySelectorAll('.admin-view-panel');
views.forEach(v => {
  console.log(`View ${v.id}: has ${v.children.length} children, innerHTML length is ${v.innerHTML.length}`);
});
