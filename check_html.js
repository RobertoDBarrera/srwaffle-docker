const fs = require('fs');
const html = fs.readFileSync('admin/index.html', 'utf8');

let openDivs = 0;
let lineNum = 1;
for (let i = 0; i < html.length; i++) {
  if (html[i] === '\n') lineNum++;
  if (html.substring(i, i + 4) === '<div') {
    openDivs++;
  } else if (html.substring(i, i + 6) === '</div>') {
    openDivs--;
  }
}
console.log('Open div balance:', openDivs);

// Parse with JSDOM to see if elements get nested incorrectly
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html);
const doc = dom.window.document;

const views = doc.querySelectorAll('.admin-view-panel');
views.forEach(v => {
  console.log('View:', v.id, 'Parent:', v.parentElement.tagName, v.parentElement.className);
});

const main = doc.querySelector('main.admin-content-area');
if (main) {
  console.log('Main contains children:', main.children.length);
} else {
  console.log('Main NOT FOUND!');
}
