const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const getFilePath = (fileName) => path.join(DATA_DIR, fileName);

function readJSON(fileName, fallback) {
  const filePath = getFilePath(fileName);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e);
    return fallback;
  }
}

function writeJSON(fileName, data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = getFilePath(fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  readJSON,
  writeJSON,
  getFilePath
};
