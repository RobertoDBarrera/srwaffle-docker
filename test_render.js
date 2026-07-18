const fs = require('fs');

let js = fs.readFileSync('admin/app.js', 'utf8');

const domElements = {};
global.document = {
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        value: '',
        textContent: '',
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {},
        appendChild: () => {},
        querySelectorAll: () => [],
        checked: false
      };
    }
    return domElements[id];
  },
  createElement: () => ({
    style: {}, classList: { add: () => {}, remove: () => {} },
    appendChild: () => {}, innerHTML: '', getAttribute: () => null,
    addEventListener: () => {}, onclick: null,
    querySelector: () => ({ addEventListener: () => {} })
  }),
  body: { appendChild: () => {} },
  querySelectorAll: () => []
};
global.window = {
  addEventListener: () => {},
  renderWaffleIngredients: () => {},
  Chart: class { constructor() { this.destroy = () => {}; } },
  getComputedStyle: () => ({ getPropertyValue: () => '' })
};
global.localStorage = { getItem: () => 'token', setItem: () => {} };
global.sessionStorage = { getItem: () => 'true', setItem: () => {} };
global.fetch = async () => ({
  ok: true,
  json: async () => []
});
global.alert = console.log;

try {
  let listeners = [];
  global.document.addEventListener = (event, cb) => {
    if (event === 'DOMContentLoaded') listeners.push(cb);
  };
  
  eval(js);
  console.log("Script evaluated.");
  
  listeners.forEach((cb, i) => {
     console.log("Calling listener " + i + "...");
     try {
       cb();
     } catch (e) {
       console.error("Listener " + i + " failed:", e);
     }
  });
  
  // Try calling switchAdminView if it's available
  // Wait, switchAdminView is defined INSIDE the first DOMContentLoaded!
  // So we can't call it from here easily. We'll have to inject it into window.
} catch(e) {
  console.error("Eval Error:", e);
}
