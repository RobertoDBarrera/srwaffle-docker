const http = require('http');

http.get('http://localhost:3000/index.html', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Includes Sorpréndeme:", data.includes('Sorpréndeme'));
    console.log("Includes tracker-btn:", data.includes('tracker-btn'));
  });
});
