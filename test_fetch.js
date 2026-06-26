(async () => {
  const res = await fetch('http://localhost:3000/admin/app.js');
  const text = await res.text();
  console.log('Includes delete function?', text.includes('window.deleteThemePreset = async (presetId) => {'));
  console.log('Includes button?', text.includes('onclick="window.deleteThemePreset'));
})();
