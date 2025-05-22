const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'deployment-log.json');
const message = process.argv[2] || 'Manual deployment';
const date = new Date().toISOString();

let log = [];
if (fs.existsSync(logPath)) {
  log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
}
log.unshift({ date, message });
fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
console.log('Deployment logged:', date, message); 