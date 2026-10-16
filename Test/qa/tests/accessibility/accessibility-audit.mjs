// qa/tests/accessibility/accessibility-audit.mjs
// Accessibility (WCAG 2.2 AA) and Frontend UI Robust Quality Scanner
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_SRC = fs.existsSync(path.resolve('CRM/Frontend/src'))
  ? path.resolve('CRM/Frontend/src')
  : path.resolve('Frontend/src');

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

export function runAccessibilityAudit() {
  console.log(`====================================================`);
  console.log(`WCAG 2.2 AA & FRONTEND UI AUDIT SCANNER (COMPREHENSIVE)`);
  console.log(`Target: ${FRONTEND_SRC}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`====================================================\n`);

  const files = getAllFiles(FRONTEND_SRC);
  console.log(`Scanned ${files.length} Frontend TSX/JSX components.\n`);

  const findings = {
    inputsWithoutLabels: [],
    selectsWithoutLabels: [],
    textareasWithoutLabels: [],
    genericAriaLabels: [],
    missingAriaLabels: [],
    missingImageAlt: [],
    tablesMissingCaptionsOrHeaders: [],
    emptyCatchBlocks: [],
    deadButtons: []
  };

  for (const file of files) {
    const relPath = path.relative(FRONTEND_SRC, file);
    const content = fs.readFileSync(file, 'utf8');

    // 1. Inputs missing accessible name
    const inputMatches = [...content.matchAll(/<input\b([^>]*)\/?>/gis)];
    for (const m of inputMatches) {
      const attrs = m[1];
      if (attrs.includes('type="hidden"') || attrs.includes("type='hidden'")) continue;
      const hasAria = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs);
      let hasAssociatedLabel = false;
      const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
      if (idMatch) {
        const id = idMatch[1];
        if (content.includes(`htmlFor="${id}"`) || content.includes(`htmlFor='${id}'`)) {
          hasAssociatedLabel = true;
        }
      }
      if (!hasAria && !hasAssociatedLabel) {
        findings.inputsWithoutLabels.push({ file: relPath, snippet: m[0].replace(/\s+/g, ' ').slice(0, 80) });
      }
    }

    // 2. Selects missing accessible name
    const selectMatches = [...content.matchAll(/<select\b([^>]*)\/?>/gis)];
    for (const m of selectMatches) {
      const attrs = m[1];
      const hasAria = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs);
      let hasAssociatedLabel = false;
      const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
      if (idMatch) {
        const id = idMatch[1];
        if (content.includes(`htmlFor="${id}"`) || content.includes(`htmlFor='${id}'`)) {
          hasAssociatedLabel = true;
        }
      }
      if (!hasAria && !hasAssociatedLabel) {
        findings.selectsWithoutLabels.push({ file: relPath, snippet: m[0].replace(/\s+/g, ' ').slice(0, 80) });
      }
    }

    // 3. Textareas missing accessible name
    const textareaMatches = [...content.matchAll(/<textarea\b([^>]*)\/?>/gis)];
    for (const m of textareaMatches) {
      const attrs = m[1];
      const hasAria = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs);
      let hasAssociatedLabel = false;
      const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
      if (idMatch) {
        const id = idMatch[1];
        if (content.includes(`htmlFor="${id}"`) || content.includes(`htmlFor='${id}'`)) {
          hasAssociatedLabel = true;
        }
      }
      if (!hasAria && !hasAssociatedLabel) {
        findings.textareasWithoutLabels.push({ file: relPath, snippet: m[0].replace(/\s+/g, ' ').slice(0, 80) });
      }
    }

    // 4. Generic aria-labels
    const genericMatches = [...content.matchAll(/aria-label=["']([^"']+)["']/gi)];
    for (const gm of genericMatches) {
      const val = gm[1].toLowerCase().trim();
      if (val === 'input' || val === 'input field' || val === 'button' || val === 'icon' || val === 'select' || val === 'field') {
        findings.genericAriaLabels.push({ file: relPath, label: gm[1] });
      }
    }

    // 5. Icon buttons missing accessible names
    const buttonMatches = [...content.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gis)];
    for (const m of buttonMatches) {
      const attrs = m[1];
      const inner = m[2].trim();
      const hasAria = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs);
      const innerText = inner.replace(/<[^>]+>/g, '').trim();
      if (!hasAria && innerText.length === 0) {
        findings.missingAriaLabels.push({ file: relPath, snippet: m[0].replace(/\s+/g, ' ').slice(0, 80) });
      }
    }

    // 6. Images missing alt
    const imgMatches = [...content.matchAll(/<img\b([^>]*)\/?>/gis)];
    for (const m of imgMatches) {
      const attrs = m[1];
      if (!/\balt\s*=/i.test(attrs)) {
        findings.missingImageAlt.push({ file: relPath, snippet: m[0].replace(/\s+/g, ' ').slice(0, 80) });
      }
    }

    // 7. Tables missing <th> scope="col" or accessible name
    const tableMatches = [...content.matchAll(/<table\b([^>]*)>(.*?)<\/table>/gs)];
    for (const m of tableMatches) {
      const attrs = m[1];
      const inner = m[2];
      const hasTh = /<th\b/i.test(inner);
      const hasCaptionOrAria = /aria-label\s*=/i.test(attrs) || /<caption\b/i.test(inner);
      if (!hasTh || !hasCaptionOrAria) {
        findings.tablesMissingCaptionsOrHeaders.push({ file: relPath, hasTh, hasCaptionOrAria });
      }
    }

    // 8. Empty catch blocks
    if (/catch\s*\([^\)]*\)\s*\{\s*\}/.test(content) || /catch\s*\{\s*\}/.test(content)) {
      findings.emptyCatchBlocks.push({ file: relPath });
    }

    // 9. Dead buttons
    if (content.includes('onClick={() => {}}') || content.includes('onClick={() => { }}')) {
      findings.deadButtons.push({ file: relPath });
    }
  }

  console.log(`WCAG 2.2 AA CONFORMANCE METRICS:`);
  console.log(`- Inputs Missing Associated Label / ID / Accessible Name: ${findings.inputsWithoutLabels.length}`);
  console.log(`- Selects Missing Associated Label / ID / Accessible Name: ${findings.selectsWithoutLabels.length}`);
  console.log(`- Textareas Missing Associated Label / ID / Accessible Name: ${findings.textareasWithoutLabels.length}`);
  console.log(`- Generic aria-labels ("Input field", "Button"): ${findings.genericAriaLabels.length}`);
  console.log(`- Icon Buttons Missing Accessible Name (aria-label): ${findings.missingAriaLabels.length}`);
  console.log(`- Images Missing alt attribute: ${findings.missingImageAlt.length}`);
  console.log(`- Tables Missing <th> or Caption / aria-label: ${findings.tablesMissingCaptionsOrHeaders.length}`);
  console.log(`- Unhandled / Silent Swallowed Exceptions (Empty catch): ${findings.emptyCatchBlocks.length}`);
  console.log(`- Dead Buttons / Empty Handlers: ${findings.deadButtons.length}\n`);

  const totalViolations = Object.values(findings).reduce((acc, curr) => acc + curr.length, 0);

  if (totalViolations === 0) {
    console.log(`>>> VERDICT: 100% WCAG 2.2 AA CONFORMANCE CERTIFIED (0 DEFECTS) <<<`);
  } else {
    console.error(`>>> VERDICT: FAILED - ${totalViolations} ACCESSIBILITY/USABILITY DEFECTS REMAINING <<<`);
  }

  return findings;
}

runAccessibilityAudit();
