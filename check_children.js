const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('admin/index.html', 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const main = doc.querySelector('main.admin-content-area');
Array.from(main.children).forEach((c, i) => {
  console.log(`Child ${i}: tagName=${c.tagName}, id=${c.id}, className=${c.className}`);
});
