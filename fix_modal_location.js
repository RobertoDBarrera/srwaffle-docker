const fs = require('fs');
let html = fs.readFileSync('admin/index.html', 'utf8');

const modalStart = html.indexOf('<!-- ================= MODAL DE EDICIÓN RÁPIDA DE TEMAS ================= -->');
if (modalStart !== -1) {
  const bodyEndIndex = html.indexOf('</body>');
  if (modalStart > bodyEndIndex) {
    const modalContent = html.substring(modalStart);
    html = html.substring(0, modalStart);
    
    html = html.replace('<!-- CONTROLADORES JAVASCRIPT -->', modalContent + '\n  <!-- CONTROLADORES JAVASCRIPT -->');
    
    // Increment cache for good measure
    html = html.replace(/app\.js\?v=\d+/, 'app.js?v=' + Date.now());
    
    fs.writeFileSync('admin/index.html', html);
    console.log('Moved modal inside body');
  } else {
    console.log('Modal is already before body');
  }
}
