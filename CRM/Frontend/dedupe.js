const fs = require('fs');
const path = require('path');

function fixDuplicates(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDuplicates(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let apiLibImports = 0;
      let toRemove = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("from '@/lib/api'") || lines[i].includes('from "@/lib/api"')) {
          apiLibImports++;
          if (apiLibImports > 1 && lines[i].trim() === "import { apiFetch } from '@/lib/api';") {
            toRemove.push(i);
          }
        }
      }
      if (toRemove.length > 0) {
        toRemove.reverse().forEach(index => {
          lines.splice(index, 1);
        });
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log('Fixed', fullPath);
      }
    }
  }
}

fixDuplicates(path.join(__dirname, 'src'));
console.log('Done');
