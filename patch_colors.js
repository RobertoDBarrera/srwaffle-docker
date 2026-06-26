const fs = require('fs');
let code = fs.readFileSync('admin/app.js', 'utf8');

const oldVars = `  const COLOR_VARIABLES_ADMIN = [
    { varName: '--bg-primary', label: 'Fondo Principal' },
    { varName: '--bg-secondary', label: 'Fondo Secundario' },
    { varName: '--neon-purple', label: 'Púrpura Neón (Acento Principal)' },
    { varName: '--neon-pink', label: 'Rosa Neón (Acento Secundario)' },
    { varName: '--text-primary', label: 'Texto Principal' }
  ];`;

const newVars = `  const COLOR_VARIABLES_ADMIN = [
    { varName: '--bg-primary', label: 'Fondo Principal' },
    { varName: '--bg-secondary', label: 'Fondo Secundario' },
    { varName: '--bg-card-raw', label: 'Fondo de Tarjetas' },
    { varName: '--bg-header-raw', label: 'Color de Cabecera' },
    { varName: '--neon-purple', label: 'Acento Principal (Púrpura)' },
    { varName: '--neon-pink', label: 'Acento Sec. (Rosa)' },
    { varName: '--neon-cyan', label: 'Acento (Cian)' },
    { varName: '--neon-yellow', label: 'Acento (Amarillo)' },
    { varName: '--text-primary', label: 'Texto Principal' },
    { varName: '--text-secondary', label: 'Texto Secundario' }
  ];`;

code = code.replace(oldVars, newVars);
fs.writeFileSync('admin/app.js', code);
console.log('Replaced colors array');
