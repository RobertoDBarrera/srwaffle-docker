const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('admin/index.html', 'utf8');
const js = fs.readFileSync('admin/app.js', 'utf8');

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost:3000/admin"
});

dom.window.eval(`
  window.fetch = () => Promise.resolve({ json: () => Promise.resolve({}) });
  window.document.addEventListener = (event, cb) => {
    if (event === 'DOMContentLoaded') {
      setTimeout(cb, 0);
    }
  };
`);

// Try executing the script
try {
  dom.window.eval(js);
  console.log("Script evaluated successfully. Waiting for DOMContentLoaded...");
  
  setTimeout(() => {
    console.log("DOMContentLoaded triggered.");
    // check if it crashed during DOMContentLoaded
    if (dom.window.onerror) {
       console.log("window.onerror fired");
    }
  }, 100);
} catch (e) {
  console.error("Execution error:", e);
}

dom.window.addEventListener("error", (event) => {
  console.error("Uncaught JS error:", event.error);
});
