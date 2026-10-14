const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    if (content.includes('https://https://')) {
      content = content.replace(/https:\/\/https:\/\//g, 'https://');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
