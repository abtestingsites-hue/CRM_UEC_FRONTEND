const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve('CRM_FINAL_QA_AUDIT');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const full = path.join(dirPath, file);
    if (fs.statSync(full).isDirectory()) {
      arrayOfFiles = getAllFiles(full, arrayOfFiles);
    } else {
      arrayOfFiles.push(full);
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(baseDir).filter(f => !f.endsWith('master_sha256_manifest.txt'));

let sha256Text = '===============================================================================\n';
sha256Text += '  ELDERCARE CRM COMPLETE AUDIT PACKAGE SHA-256 MASTER MANIFEST\n';
sha256Text += `  Generated: ${new Date().toISOString()}\n`;
sha256Text += '===============================================================================\n\n';

for (const f of allFiles) {
  const rel = path.relative(baseDir, f).replace(/\\/g, '/');
  const buffer = fs.readFileSync(f);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const size = buffer.length;
  sha256Text += `${hash}  (${String(size).padStart(7)} bytes)  ${rel}\n`;
}

fs.writeFileSync(path.join(baseDir, '03_EVIDENCE/evidence_sha256_manifest.txt'), sha256Text);
fs.writeFileSync(path.join(baseDir, 'master_sha256_manifest.txt'), sha256Text);

console.log('Total files hashed:', allFiles.length);
console.log('Written: master_sha256_manifest.txt');
