const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetUrl = '`${typeof window !== "undefined" ? (window.location.hostname.includes("devtunnels.ms") ? "https://" + window.location.hostname.replace("3000", "4000") : "http://" + window.location.hostname + ":4000") : "https://060tzm8w-4000.inc1.devtunnels.ms"}`';
const replacement = '"https://060tzm8w-4000.inc1.devtunnels.ms"';

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Support variations with or without backticks
    const targetUrlRaw = '${typeof window !== "undefined" ? (window.location.hostname.includes("devtunnels.ms") ? "https://" + window.location.hostname.replace("3000", "4000") : "http://" + window.location.hostname + ":4000") : "https://060tzm8w-4000.inc1.devtunnels.ms"}';
    const targetWithBackticks = '`' + targetUrlRaw + '`';

    if (content.includes(targetWithBackticks)) {
      content = content.split(targetWithBackticks).join(replacement);
      changed = true;
    }
    if (content.includes(targetUrlRaw)) {
      content = content.split(targetUrlRaw).join('https://060tzm8w-4000.inc1.devtunnels.ms');
      changed = true;
    }
    
    // Fix the socket.io initialization which might be in quotes instead of backticks
    if (content.includes(`io('${replacement}'`)) {
      content = content.split(`io('${replacement}'`).join(`io(\`${replacement}\``);
    }
    if (content.includes(`io("${replacement}"`)) {
      content = content.split(`io("${replacement}"`).join(`io(\`${replacement}\``);
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
