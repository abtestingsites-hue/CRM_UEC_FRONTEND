const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
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
  let needsApiFetch = false;
  let needsApiBaseUrl = false;

  // 1. Replace fetch(`https://crm-uec-backend.onrender.com...`)
  // Regex looks for fetch('https://crm-uec-backend.onrender.com/path') or fetch(`https://crm-uec-backend.onrender.com/path`)
  const fetchRegex = /fetch\s*\(\s*(['"`])http:\/\/localhost:4000(.*?)\1/g;
  if (fetchRegex.test(content)) {
    needsApiFetch = true;
    content = content.replace(fetchRegex, 'apiFetch($1$2$1');
  }

  // Handle template literals with variables e.g. fetch(`https://crm-uec-backend.onrender.com/api/v1/leads/${id}`)
  const fetchTemplateRegex = /fetch\s*\(\s*`http:\/\/localhost:4000(.*?)`/g;
  if (fetchTemplateRegex.test(content)) {
    needsApiFetch = true;
    content = content.replace(fetchTemplateRegex, 'apiFetch(`$1`');
  }

  // 2. Replace axios(`https://crm-uec-backend.onrender.com...`)
  const axiosRegex = /axios(\.[a-z]+)?\s*\(\s*`http:\/\/localhost:4000(.*?)`/g;
  if (axiosRegex.test(content)) {
    needsApiBaseUrl = true;
    content = content.replace(axiosRegex, 'axios$1(`${API_BASE_URL}$2`');
  }
  const axiosQuoteRegex = /axios(\.[a-z]+)?\s*\(\s*(['"])http:\/\/localhost:4000(.*?)\2/g;
  if (axiosQuoteRegex.test(content)) {
    needsApiBaseUrl = true;
    content = content.replace(axiosQuoteRegex, 'axios$1(`${API_BASE_URL}$3`');
  }

  // 3. Replace loose variables e.g. let url = 'https://crm-uec-backend.onrender.com...'
  const looseUrlRegex = /(['"`])http:\/\/localhost:4000(.*?)(\1)/g;
  if (looseUrlRegex.test(content)) {
    // Only replace if it wasn't already caught by fetch/axios, but to be safe we replace remaining occurrences with API_BASE_URL string interpolation
    needsApiBaseUrl = true;
    content = content.replace(looseUrlRegex, (match, p1, p2, p3) => {
      if (p1 === '`') return '`${API_BASE_URL}' + p2 + '`';
      return '`${API_BASE_URL}' + p2 + '`';
    });
  }

  if (content !== originalContent) {
    // Add imports if necessary
    const imports = [];
    if (needsApiFetch) imports.push('apiFetch');
    if (needsApiBaseUrl) imports.push('API_BASE_URL');

    if (imports.length > 0 && !content.includes('from \'@/lib/api\'') && !content.includes('from "@/lib/api"')) {
      const importStatement = `import { ${imports.join(', ')} } from '@/lib/api';\n`;
      // Insert after the last import, or at the top
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLastImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
      } else {
        content = importStatement + content;
      }
    } else if (imports.length > 0) {
      // It already has an import from @/lib/api, ensure both are imported if needed (this is a simple script, we might need manual fix if it misses)
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

processDirectory(srcDir);
console.log('Done refactoring!');
