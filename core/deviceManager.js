const fs = require('fs');
const path = require('path');

let devices = [];

try {
    const dataPath = path.join(__dirname, 'deviceData.json');
    if (fs.existsSync(dataPath)) {
        devices = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } else {
        // Fallback to static defaults if JSON is missing
        devices = [
            { id: 'iphone13', name: "iPhone 13", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1", width: 390, height: 844 },
            { id: 'galaxyS21', name: "Galaxy S21", userAgent: "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36", width: 360, height: 800 },
            { id: 'ipad', name: "iPad Air", userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1", width: 820, height: 1180 }
        ];
    }
} catch (err) {
    console.error("Error loading devices:", err);
}

module.exports = devices;
