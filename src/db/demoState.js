const fs = require('fs');
const path = require('path');

const stateFile = path.join(__dirname, '..', '..', 'data', 'demo_state.json');

let isDemoMode = false;

const loadDemoState = () => {
    try {
        if (fs.existsSync(stateFile)) {
            const data = fs.readFileSync(stateFile, 'utf8');
            isDemoMode = JSON.parse(data).isDemoMode || false;
        } else {
            isDemoMode = false;
        }
    } catch (e) {
        console.error("Error loading demo state:", e);
        isDemoMode = false;
    }
};

const setDemoMode = (val) => {
    isDemoMode = Boolean(val);
    try {
        const dir = path.dirname(stateFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(stateFile, JSON.stringify({ isDemoMode }));
    } catch (e) {
        console.error("Error saving demo state:", e);
    }
};

const getDemoMode = () => isDemoMode;

loadDemoState();

module.exports = {
    getDemoMode,
    setDemoMode
};
