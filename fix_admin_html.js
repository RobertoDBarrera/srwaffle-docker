const fs = require('fs');

let adminHtml = fs.readFileSync('admin/index.html', 'utf8');

if (!adminHtml.includes('admin-hero-carousel-interval')) {
  const insertHtml = `
          <div class="form-group" style="display:flex; justify-content:center; align-items:center; gap:15px; margin-bottom: 20px;">
            <label for="admin-hero-carousel-interval" style="font-size:0.9rem; font-weight:600; color:var(--text-secondary);">Tiempo entre imágenes (segundos):</label>
            <input type="number" id="admin-hero-carousel-interval" class="form-control" value="4" min="1" max="20" style="width: 80px; background:#181818; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:0.5rem; text-align:center;">
          </div>`;
          
  const targetStr = `<span style="font-size:1rem; font-weight:700; color:var(--neon-purple);">Carrusel Animado</span>
          </div>`;
          
  if (adminHtml.includes(targetStr)) {
    adminHtml = adminHtml.replace(
      targetStr,
      targetStr + insertHtml
    );
    fs.writeFileSync('admin/index.html', adminHtml);
    console.log('Successfully patched admin/index.html');
  } else {
    console.log('Target string not found in admin/index.html');
  }
} else {
  console.log('Already patched');
}
