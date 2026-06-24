const fs = require('fs');
let code = fs.readFileSync('theme-manager.js', 'utf8');

if (!code.includes("document.body.classList.add('is-client-page');")) {
  code = code.replace(
    "async function init() {",
    "async function init() {\n    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {\n      document.body.classList.add('is-client-page');\n    }"
  );
  fs.writeFileSync('theme-manager.js', code);
  console.log('Added is-client-page correctly!');
} else {
  console.log('Already added');
}
