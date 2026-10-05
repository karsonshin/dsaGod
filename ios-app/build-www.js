// Copies the web app into ./www for Capacitor. The app is plain static files, so this is a straight copy.
// Run from ios-app/:  node build-www.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of ['index.html', 'css', 'js', 'data', 'fonts', 'vendor']) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log('www ready:', fs.readdirSync(out).join(', '));
