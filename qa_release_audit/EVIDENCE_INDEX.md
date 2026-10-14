# PARAMANTRA / ELDERCARE CRM — EVIDENCE & ARTIFACT INDEX

**Audit Date:** October 13, 2026  
**Auditor:** Principal QA Architect  
**Build & Environment Metadata:**
- **Target Host:** `http://localhost:4000` (NestJS Unified Architecture, Port 4000)
- **Node.js Runtime:** `v24.20.0`
- **Host OS:** Windows 10 Enterprise
- **ORM / Database:** Prisma v5.22.0 / PostgreSQL (Supabase Session Pooler)
- **Cache / Presence:** Redis Labs Cloud (`redislabs.com:12592`)
- **WebRTC / Telephony:** LiveKit Cloud & Vobiz SIP Provider

---

## 1. Raw Execution Evidence Index

All raw execution logs are saved in [`qa_release_audit/evidence/`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence):

| Evidence File | File Size | Timestamp | Supported Test IDs | Summary of Findings |
| :--- | :---: | :---: | :--- | :--- |
| [`smoke-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/smoke-test-results-fresh.txt) | 1,140 B | 2026-10-13 19:57 | TC-SMK-01 to TC-SMK-08 | 4 passed (Root, Telephony, Leads 200, Agents), 4 failed (/api/v1/health, /leads, /dashboard/analytics, /calendar). |
| [`unit-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/unit-test-results-fresh.txt) | 1,418 B | 2026-10-13 19:58 | TC-UNIT-01 to TC-UNIT-08 | 8 assertions passed in runner. Confirms password plaintext check and mock token structure in application. |
| [`integration-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/integration-test-results-fresh.txt) | 1,024 B | 2026-10-13 19:58 | TC-INT-01 to TC-INT-07 | 7 assertions passed in runner. Confirms route mismatch on `/leads` and invalid XML on `/vobiz/incoming`. |
| [`security-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/security-test-results-fresh.txt) | 837 B | 2026-10-13 19:58 | TC-SEC-01 to TC-SEC-06 | 6 assertions passed in runner. Confirms public agent PII exposure, unauthenticated IDOR recording access, and plaintext `.env` keys. |
| [`load-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/load-test-results-fresh.txt) | 1,296 B | 2026-10-13 19:59 | TC-PERF-01 to TC-PERF-03 | Measures p50, p90, p95, p99 across 5/10/25 VUs. Captures Supabase `pool_size: 15` exhaustion fatal errors (3x 500s). |
| [`stress-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/stress-test-results-fresh.txt) | 1,060 B | 2026-10-13 19:59 | TC-PERF-04 | 50 concurrent requests handled in 0.03s; post-stress health recovery ping = 3ms. |
| [`regression-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/regression-test-results-fresh.txt) | 739 B | 2026-10-13 19:59 | TC-REG-01 to TC-REG-05 | 5 core regression tests passed cleanly in 4.47s. |
| [`e2e-workflow-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/e2e-workflow-results-fresh.txt) | 716 B | 2026-10-13 20:00 | TC-E2E-01 | 5-step inbound webhook and CRM disposition flow executed in 3.96s. |
| [`accessibility-audit-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/accessibility-audit-results-fresh.txt) | 1,499 B | 2026-10-13 19:58 | TC-A11Y-01 to TC-A11Y-03 | 134 components scanned: 90 unlabeled inputs, 6 unnamed icon buttons, 6 missing image alts. |

---

## 2. Master Deliverables Directory

All finalized audit reports are saved in [`qa_release_audit/`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit):

1. [`EXECUTIVE_QA_ASSESSMENT.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/EXECUTIVE_QA_ASSESSMENT.md) — Executive release verdict, quality status, top risks, and immediate actions.
2. [`TEST_EVIDENCE_VALIDATION.csv`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/TEST_EVIDENCE_VALIDATION.csv) — Audited validation matrix verifying claims, test locations, discrepancies, and confidence.
3. [`MASTER_TEST_CASES.csv`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/MASTER_TEST_CASES.csv) — 40 test specifications with dual execution and application quality classifications.
4. [`DEFECT_REGISTER.csv`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/DEFECT_REGISTER.csv) — 22 verified defects with root causes, reproductions, recommended fixes, and retest statuses.
5. [`SECURITY_ASSESSMENT.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/SECURITY_ASSESSMENT.md) — Comprehensive OWASP vulnerability assessment and risk scoring.
6. [`PERFORMANCE_AND_CAPACITY_REPORT.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/PERFORMANCE_AND_CAPACITY_REPORT.md) — Multi-stage latency distributions, Supabase pool exhaustion diagnostics, and measurement caveats.
7. [`ACCESSIBILITY_AND_USABILITY_REPORT.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/ACCESSIBILITY_AND_USABILITY_REPORT.md) — WCAG 2.2 AA audit across 134 frontend components and usability friction points.
8. [`REQUIREMENT_TO_TEST_TRACEABILITY.csv`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/REQUIREMENT_TO_TEST_TRACEABILITY.csv) — Traceability mapping between requirements, tests, defects, and acceptance statuses.
9. [`UAT_CHECKLIST.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/UAT_CHECKLIST.md) — 7 role-based business acceptance scenarios and governance decisions.
10. [`REGRESSION_AND_RELEASE_GATE_REPORT.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/REGRESSION_AND_RELEASE_GATE_REPORT.md) — Previous vs fresh comparison and evaluation of all 7 release gates.
11. [`TEST_EXECUTION_SUMMARY.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/TEST_EXECUTION_SUMMARY.md) — Mathematical execution reconciliation, category breakdowns, and coverage gaps.
12. [`EVIDENCE_INDEX.md`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/EVIDENCE_INDEX.md) — Metadata, supported test IDs, and evidence cross-references.

---

## 3. Identified Evidence Gaps & Staging Retest Requirements

- **Browser-Driven Softphone Audio:** LiveKit audio packets between two browser softphones could not be automatically evaluated in a headless node environment and require browser-based WebRTC automation in a staging lab.
- **Sustained Endurance Testing:** Long-duration endurance testing (30–60 minutes at 50 VUs) is required to evaluate garbage collection pauses and Prisma memory leaks under sustained traffic.
