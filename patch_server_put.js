const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const putEndpoint = `
app.put('/api/developer/preset/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, styles } = req.body;
    const current = await db.getSettings();
    const presets = current.customPresets || [];
    
    const index = presets.findIndex(p => p.id === id);
    if (index !== -1) {
      if (name) presets[index].name = name;
      if (styles) presets[index].styles = styles;
      await db.updateSettings({ ...current, customPresets: presets });
      res.json({ success: true, preset: presets[index] });
    } else {
      res.status(404).json({ error: 'Preset not found' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
`;

if (!code.includes("app.put('/api/developer/preset/:id'")) {
  code = code.replace(
    /app\.delete\('\/api\/developer\/preset\/:id', async \(req, res\) => \{/,
    putEndpoint + "\napp.delete('/api/developer/preset/:id', async (req, res) => {"
  );
  fs.writeFileSync('server.js', code);
  console.log('Added PUT /api/developer/preset/:id to server.js');
} else {
  console.log('Already added');
}
