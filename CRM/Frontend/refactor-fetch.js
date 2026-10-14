const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    // skip api.ts
    if (fullPath.endsWith('api.ts')) continue;
    
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace fetch( with apiFetch( 
  // ONLY if it's awaiting it to avoid touching unrelated functions named fetch
  if (content.includes('await fetch(')) {
    content = content.replace(/await fetch\(/g, 'await apiFetch(');
  }

  // Replace API_URL and baseUrl variables with API_BASE_URL or just use apiFetch relative paths
  // Since apiFetch handles absolute URLs and prepends API_BASE_URL automatically, we can just leave the variables or change them.
  // E.g. fetch(`${API_URL}/leads`) -> apiFetch(`${API_URL}/leads`) -> apiFetch handles it because it checks if it starts with http.
  // Booking modal fix
  if (content.includes('http://localhost:3000/appointments')) {
    content = content.replace(/http:\/\/localhost:3000/g, '${API_BASE_URL}');
  }

  if (content !== originalContent) {
    if (!content.includes('import { apiFetch }') && !content.includes('import {apiFetch}')) {
      const importStatement = `import { apiFetch } from '@/lib/api';\n`;
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLastImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
      } else {
        content = importStatement + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

processDirectory(srcDir);
console.log('Done refactoring fetch!');
