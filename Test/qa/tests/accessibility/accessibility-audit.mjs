// qa/tests/accessibility/accessibility-audit.mjs
// Accessibility (WCAG 2.2 AA) and Frontend UI Static Scanner
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_SRC = path.resolve('CRM/Frontend/src');

function getAllFiles(dir, exts = ['.tsx', '.jsx', '.ts']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(item.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function runAccessibilityAudit() {
  console.log(`====================================================`);
  console.log(`WCAG 2.2 AA & FRONTEND UI AUDIT SCANNER`);
  console.log(`Target: ${FRONTEND_SRC}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`====================================================\n`);

  const files = getAllFiles(FRONTEND_SRC);
  console.log(`Scanned ${files.length} Frontend TSX/JSX components.\n`);

  const findings = {
    missingAriaLabels: [],
    missingImageAlt: [],
    inputsWithoutLabels: [],
    deadButtons: [],
    lowContrastPatterns: []
  };

  for (const file of files) {
    const relPath = path.relative(FRONTEND_SRC, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // 1. Icon-only buttons without aria-label
      if (line.includes('<button') && !line.includes('aria-label') && (line.includes('<Icon') || line.includes('<Lucide') || line.includes('<Plus') || line.includes('<Trash') || line.includes('<Search') || line.includes('<Filter') || line.includes('<X'))) {
        findings.missingAriaLabels.push({ file: relPath, line: lineNum, snippet: line.trim() });
      }

      // 2. Images missing alt
      if (line.includes('<img') && !line.includes('alt=')) {
        findings.missingImageAlt.push({ file: relPath, line: lineNum, snippet: line.trim() });
      }

      // 3. Inputs missing aria-label or id
      if (line.includes('<input') && !line.includes('aria-label') && !line.includes('id=') && !line.includes('type="hidden"')) {
        findings.inputsWithoutLabels.push({ file: relPath, line: lineNum, snippet: line.trim() });
      }

      // 4. Dead buttons: onClick={() => {}} or empty handler
      if (line.includes('onClick={() => {}}') || line.includes('onClick={() => { }}') || line.includes('onClick={() => alert(')) {
        findings.deadButtons.push({ file: relPath, line: lineNum, snippet: line.trim() });
      }

      // 5. Low contrast / washed out text combinations
      if (line.includes('text-slate-300') || line.includes('text-zinc-300') || line.includes('text-gray-300')) {
        if (line.includes('bg-white') || line.includes('bg-slate-50')) {
          findings.lowContrastPatterns.push({ file: relPath, line: lineNum, snippet: line.trim() });
        }
      }
    });
  }

  console.log(`RESULTS SUMMARY:`);
  console.log(`- Icon Buttons Missing Accessible Name (aria-label): ${findings.missingAriaLabels.length}`);
  console.log(`- Inputs Missing Associated Label / ID: ${findings.inputsWithoutLabels.length}`);
  console.log(`- Images Missing alt attribute: ${findings.missingImageAlt.length}`);
  console.log(`- Dead Buttons / Empty Handlers: ${findings.deadButtons.length}`);
  console.log(`- Low-Contrast Flagged Pairs: ${findings.lowContrastPatterns.length}\n`);

  console.log(`TOP SAMPLE FINDINGS:`);
  if (findings.missingAriaLabels.length > 0) {
    console.log(`\n[A11Y-01] Missing aria-label on icon buttons:`);
    findings.missingAriaLabels.slice(0, 5).forEach(f => console.log(`  ${f.file}:${f.line} -> ${f.snippet.substring(0, 75)}...`));
  }

  if (findings.inputsWithoutLabels.length > 0) {
    console.log(`\n[A11Y-02] Inputs without explicit label associations:`);
    findings.inputsWithoutLabels.slice(0, 5).forEach(f => console.log(`  ${f.file}:${f.line} -> ${f.snippet.substring(0, 75)}...`));
  }

  if (findings.deadButtons.length > 0) {
    console.log(`\n[UI-DEAD-01] Dead Buttons with empty handlers:`);
    findings.deadButtons.slice(0, 5).forEach(f => console.log(`  ${f.file}:${f.line} -> ${f.snippet.substring(0, 75)}...`));
  }

  return findings;
}

runAccessibilityAudit();
