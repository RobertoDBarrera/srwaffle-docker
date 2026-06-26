const fs = require('fs');

let themeCode = fs.readFileSync('theme-manager.js', 'utf8');

if (!themeCode.includes('window.SrWafflePresets = PRESETS;')) {
  // Find where PRESETS ends or just add it before the first function
  themeCode = themeCode.replace(
    '  const COLOR_VARIABLES = [',
    '  window.SrWafflePresets = PRESETS;\n\n  const COLOR_VARIABLES = ['
  );
  fs.writeFileSync('theme-manager.js', themeCode);
  console.log('Exposed PRESETS to window');
} else {
  console.log('Already exposed');
}
