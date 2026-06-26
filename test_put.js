const fetch = require('node-fetch');

(async () => {
  const settingsRes = await fetch('http://localhost:3000/api/developer/settings');
  const settings = await settingsRes.json();
  const presets = settings.customPresets || [];
  if (presets.length === 0) {
    console.log('No custom presets to edit');
    return;
  }
  const presetToEdit = presets[0];
  console.log('Editing:', presetToEdit.id);
  
  const res = await fetch(`http://localhost:3000/api/developer/preset/${presetToEdit.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: presetToEdit.name + ' Edited', styles: presetToEdit.styles })
  });
  
  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Response:', data);
})();
