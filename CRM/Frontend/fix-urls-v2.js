const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const oldStr = '`http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:4000';
const newStr = '`${typeof window !== "undefined" ? (window.location.hostname.includes("devtunnels.ms") ? "https://" + window.location.hostname.replace("3000", "4000") : "http://" + window.location.hostname + ":4000") : "https://060tzm8w-4000.inc1.devtunnels.ms"}';

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    if (content.includes(oldStr)) {
      content = content.split(oldStr).join(newStr);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
