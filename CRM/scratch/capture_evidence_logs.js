const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const baseDir = path.resolve('CRM_FINAL_QA_AUDIT/03_EVIDENCE');

console.log('Capturing real empirical test evidence to:', baseDir);

const tasks = [
  {
    cwd: 'Backend',
    cmd: 'npm run test:telephony',
    file: 'test_runner_logs/telephony_queue_orchestration.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npm run test:socket-presence',
    file: 'test_runner_logs/telephony_socket_auth_presence.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npm run test:status-idempotency',
    file: 'test_runner_logs/telephony_status_idempotency.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npm run test:agent-creation',
    file: 'test_runner_logs/agent_creation.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npx ts-node -T src/telephony/call-audio-lifecycle.spec.ts',
    file: 'test_runner_logs/call_audio_lifecycle.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npx ts-node -T src/telephony/livekit-recording-rootcause.spec.ts',
    file: 'test_runner_logs/livekit_recording_rootcause.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npx ts-node -T src/telephony/inbound-recording-summary-fix.spec.ts',
    file: 'test_runner_logs/inbound_recording_summary_fix.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npm run test:controlled-reconnect',
    file: 'test_runner_logs/live_reconnect_controlled.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npx tsc -p tsconfig.build.json',
    file: 'build_and_deployment/backend_build.log'
  },
  {
    cwd: 'Backend',
    cmd: 'npx ts-node -T scratch/test_full_call_egress.ts',
    file: 'recording_and_storage_evidence/livekit_egress_call_test.log'
  },
  {
    cwd: 'Backend',
    cmd: 'node scratch/integration_deep_audit.js',
    file: 'database_verification/database_model_counts.log'
  }
];

for (const t of tasks) {
  const fullCwd = path.resolve(t.cwd);
  const targetPath = path.join(baseDir, t.file);
  console.log(`Running: ${t.cmd} in ${t.cwd}...`);
  try {
    const output = execSync(t.cmd, { cwd: fullCwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    fs.writeFileSync(targetPath, output);
    console.log(`  Saved to: ${t.file} (${output.length} bytes)`);
  } catch (err) {
    const combined = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + err.message;
    fs.writeFileSync(targetPath, combined);
    console.log(`  Saved error output to: ${t.file} (${combined.length} bytes)`);
  }
}

// Write npm audit logs
try {
  const backendAudit = execSync('npm audit', { cwd: path.resolve('Backend'), encoding: 'utf8' });
  fs.writeFileSync(path.join(baseDir, 'security_scan_results/backend_npm_audit.log'), backendAudit);
} catch (e) {
  fs.writeFileSync(path.join(baseDir, 'security_scan_results/backend_npm_audit.log'), (e.stdout || '') + '\n' + (e.stderr || ''));
}

try {
  const frontendAudit = execSync('npm audit', { cwd: path.resolve('Frontend'), encoding: 'utf8' });
  fs.writeFileSync(path.join(baseDir, 'security_scan_results/frontend_npm_audit.log'), frontendAudit);
} catch (e) {
  fs.writeFileSync(path.join(baseDir, 'security_scan_results/frontend_npm_audit.log'), (e.stdout || '') + '\n' + (e.stderr || ''));
}

// Generate SHA-256 Manifest and CSV
console.log('\nComputing SHA-256 hashes for all evidence files...');

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

const allFiles = getAllFiles(baseDir).filter(f => !f.endsWith('.csv') && !f.endsWith('.txt'));
let sha256Text = '===============================================================================\n';
sha256Text += '  ELDERCARE CRM EVIDENCE SHA-256 INTEGRITY MANIFEST\n';
sha256Text += `  Generated: ${new Date().toISOString()}\n`;
sha256Text += '===============================================================================\n\n';

let manifestCsv = 'File ID,Relative Path,File Name,Size (Bytes),SHA-256 Hash,Collection Timestamp,Category\n';

let id = 1;
for (const f of allFiles) {
  const rel = path.relative(baseDir, f).replace(/\\/g, '/');
  const buffer = fs.readFileSync(f);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const size = buffer.length;
  const time = fs.statSync(f).mtime.toISOString();
  const cat = rel.split('/')[0] || 'general';

  sha256Text += `${hash}  ${rel}\n`;
  manifestCsv += `EVID-${String(id).padStart(3, '0')},${rel},${path.basename(f)},${size},${hash},${time},${cat}\n`;
  id++;
}

fs.writeFileSync(path.join(baseDir, 'evidence_sha256_manifest.txt'), sha256Text);
fs.writeFileSync(path.join(baseDir, 'evidence_manifest.csv'), manifestCsv.trim());

console.log('Written: evidence_sha256_manifest.txt');
console.log('Written: evidence_manifest.csv');
console.log('Evidence capture complete.');
