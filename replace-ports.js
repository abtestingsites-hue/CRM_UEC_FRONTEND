const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const replacement = '`${typeof window !== "undefined" ? (window.location.hostname.includes("devtunnels.ms") ? "https://" + window.location.hostname.replace(/-\\d+\\./, "-3005.") : "http://" + window.location.hostname + ":3005") : "https://060tzm8w-3005.inc1.devtunnels.ms/"}`';

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace legacy hardcoded devtunnel URL string literals
    const legacyUrlPattern = /https:\/\/b5tvsxt0-4000\.inc1\.devtunnels\.ms/g;
    if (legacyUrlPattern.test(content)) {
      content = content.replace(legacyUrlPattern, 'https://060tzm8w-3005.inc1.devtunnels.ms/');
      changed = true;
    }

    // Replace other port 4000 hardcodings
    if (content.includes(':4000')) {
      content = content.split(':4000').join(':3005');
      changed = true;
    }
    if (content.includes("'4000'")) {
      content = content.split("'4000'").join("'3005'");
      changed = true;
    }
    if (content.includes('"4000"')) {
      content = content.split('"4000"').join('"3005"');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
