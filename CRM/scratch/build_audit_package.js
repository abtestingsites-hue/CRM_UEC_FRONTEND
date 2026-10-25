const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve('CRM_FINAL_QA_AUDIT');

console.log('Generating CRM_FINAL_QA_AUDIT package at:', baseDir);

const dirs = [
  '00_EXECUTIVE_SUMMARY',
  '01_TEST_STRATEGY',
  '02_TEST_RESULTS',
  '03_EVIDENCE',
  '03_EVIDENCE/screenshots',
  '03_EVIDENCE/test_runner_logs',
  '03_EVIDENCE/api_evidence',
  '03_EVIDENCE/database_verification',
  '03_EVIDENCE/telephony_evidence',
  '03_EVIDENCE/recording_and_storage_evidence',
  '03_EVIDENCE/performance_results',
  '03_EVIDENCE/security_scan_results',
  '03_EVIDENCE/build_and_deployment',
  '04_DEFECTS',
  '04_DEFECTS/Retest_Evidence',
  '05_ARCHITECTURE',
  '05_ARCHITECTURE/source',
  '06_WORKFLOWS',
  '06_WORKFLOWS/source',
  '07_PERFORMANCE',
  '07_PERFORMANCE/Performance_Charts',
  '08_SECURITY',
  '08_SECURITY/Restricted_Evidence',
  '09_RELEASE_READINESS',
  '10_CLIENT_HANDOVER'
];

for (const d of dirs) {
  fs.mkdirSync(path.join(baseDir, d), { recursive: true });
}

console.log('Directories created successfully.');
