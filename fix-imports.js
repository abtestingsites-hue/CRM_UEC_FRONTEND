const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('apiFetch(') || content.includes('apiFetch =')) {
        // If it uses apiFetch, check if it's imported
        const hasImport = /import\s+{[^}]*apiFetch[^}]*}\s+from\s+['"]@\/lib\/api['"]/.test(content);
        if (!hasImport && !fullPath.endsWith('api.ts')) {
          // If it has API_BASE_URL import, modify it to include apiFetch
          if (content.includes("import { API_BASE_URL } from '@/lib/api'")) {
            content = content.replace("import { API_BASE_URL } from '@/lib/api'", "import { apiFetch, API_BASE_URL } from '@/lib/api'");
          } else if (content.includes('import {API_BASE_URL} from "@/lib/api"')) {
            content = content.replace('import {API_BASE_URL} from "@/lib/api"', 'import { apiFetch, API_BASE_URL } from "@/lib/api"');
          } else {
             // Just add the import
             content = `import { apiFetch } from '@/lib/api';\n` + content;
          }
          fs.writeFileSync(fullPath, content);
          console.log('Fixed imports in', fullPath);
        }
      }
    }
  }
}

fixImports(path.join(__dirname, 'src'));
console.log('Done');
