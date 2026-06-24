const fs = require('fs');
let code = fs.readFileSync('theme-manager.js', 'utf8');

if (!code.includes("document.getElementById('dev-text-title').oninput")) {
  const listeners = `
    document.getElementById('dev-text-title').oninput = (e) => {
      currentTexts.title = e.target.value;
      applyThemeStyles({ texts: currentTexts });
    };
    document.getElementById('dev-text-banner').oninput = (e) => {
      currentTexts.banner = e.target.value;
      applyThemeStyles({ texts: currentTexts });
    };
  `;
  
  code = code.replace(
    `currentLayout.menuPos = e.target.value;
      applyThemeStyles({ layout: currentLayout });
    };`,
    `currentLayout.menuPos = e.target.value;
      applyThemeStyles({ layout: currentLayout });
    };${listeners}`
  );
  
  fs.writeFileSync('theme-manager.js', code);
  console.log('Added text inputs live preview to theme-manager.js');
} else {
  console.log('Live preview already exists');
}
