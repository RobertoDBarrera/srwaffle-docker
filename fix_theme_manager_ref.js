const fs = require('fs');

let themeCode = fs.readFileSync('theme-manager.js', 'utf8');

// 1. Remove it from the top
themeCode = themeCode.replace('  window.SrWafflePresets = PRESETS;\n\n', '');
themeCode = themeCode.replace('  window.SrWafflePresets = PRESETS;\n', '');
themeCode = themeCode.replace('  window.SrWafflePresets = PRESETS;', '');

// 2. Put it after PRESETS
if (!themeCode.includes('window.SrWafflePresets = PRESETS;')) {
  themeCode = themeCode.replace(
    '  function hexToRgba(hex, alpha) {',
    '  window.SrWafflePresets = PRESETS;\n\n  function hexToRgba(hex, alpha) {'
  );
  fs.writeFileSync('theme-manager.js', themeCode);
  console.log('Successfully fixed theme-manager.js ReferenceError');
} else {
  console.log('It was already there somehow.');
}
