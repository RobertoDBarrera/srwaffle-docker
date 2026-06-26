const fs = require('fs');
let html = fs.readFileSync('admin/index.html', 'utf8');

const modalStart = html.indexOf('<!-- ================= MODAL DE EDICIÓN RÁPIDA DE TEMAS ================= -->');

if (modalStart !== -1) {
  // Extract modal
  const modalHTML = html.substring(modalStart);
  
  // Remove it from the end
  html = html.substring(0, modalStart);
  
  // Clean up any rogue </body></html> that might be stuck
  html = html.replace(/<\/body>\s*<\/html>/g, '');
  
  // Put modal right before the script tags, AND add body/html back
  html = html.replace('<!-- CONTROLADORES JAVASCRIPT -->', modalHTML + '\n  <!-- CONTROLADORES JAVASCRIPT -->');
  html += '\n</body>\n</html>';
  
  // Bump app.js
  html = html.replace(/app\.js\?v=\d+/, 'app.js?v=' + Date.now());
  
  fs.writeFileSync('admin/index.html', html);
  console.log('Fixed modal placement to be clearly inside the body before scripts.');
} else {
  console.log('Modal not found at the end.');
}
