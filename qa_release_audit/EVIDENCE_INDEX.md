# PARAMANTRA / ELDERCARE CRM — EVIDENCE & ARTIFACT INDEX

**Audit Date:** October 16, 2026  
**Auditor:** Principal QA Architect  
**Build & Environment Metadata:**
- **Target Backend:** `http://localhost:4000` (NestJS Unified Architecture, Port 4000)
- **Target Frontend:** `http://localhost:3000` (Next.js 16.2.6 Production Build, Port 3000)
- **Node.js Runtime:** `v24.20.0`
- **Host OS:** Windows 10 Enterprise
- **ORM / Database:** Prisma v5.22.0 / PostgreSQL (Supabase Transaction Pooler)
- **Cache / Presence:** Co-located Redis Presence Engine (150ms bounded timeout)
- **WebRTC / Telephony:** LiveKit Cloud & Vobiz SIP Carrier Provider
- **AI Analytics:** Google GenAI SDK (Model: `gemini-3.5-flash`)

---

## 1. Raw Execution Evidence Index

All raw execution logs are saved in [`qa_release_audit/evidence/`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence):

| Evidence File | Timestamp | Supported Test IDs | Summary of Verified Findings |
| :--- | :---: | :--- | :--- |
| [`smoke-test-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/smoke-test-results-fresh.txt) | 2026-10-16 23:47 | TC-SMK-01 to TC-SMK-08 | 8/8 smoke tests passed (100% pass rate). Root, Telephony, Health, Leads canonical & alias, Agents, Dashboard, and Calendar return 200 OK. |
| [`unit-test-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/unit-test-results-fresh.txt) | 2026-10-16 23:44 | TC-UNIT-01 to TC-UNIT-08 | 8/8 unit tests passed (100% pass rate). Bcrypt compare, JWT signature/exp, RBAC matrix, state machine, E.164, RFC email, duration, and deduplication verified. |
| [`integration-test-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/integration-test-results-fresh.txt) | 2026-10-16 23:45 | TC-INT-01 to TC-INT-07 | 7/7 integration tests passed (100% pass rate). Root protocol, LiveKit connector, agent REST model, lead persistence, Vobiz 200 TwiML XML, IDOR defense verified. |
| [`phase3-functional-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/phase3-functional-results-fresh.txt) | 2026-10-16 23:45 | TC-FUNC-01 to TC-FUNC-19 | 21/21 functional tests passed (100% pass rate). Leads CRUD, search, pagination, phone uniqueness (409), conversion notes fallback (DEF-23), tickets, and calendar verified. |
| [`phase5-telephony-ai-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/phase5-telephony-ai-results-fresh.txt) | 2026-10-16 23:46 | TC-SMK-02, TC-INT-06, etc.| 15/15 telephony & AI tests passed (100% pass rate). Carrier contract, TwiML XML, status callbacks, queue orchestration, and live Gemini AI integration verified. |
| [`phase6-omnichannel-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/phase6-omnichannel-results-fresh.txt) | 2026-10-16 23:46 | TC-UNIT-08, TC-FUNC-16, etc.| 13/13 omnichannel tests passed (100% pass rate). False success removed, 503 provider guards active, Meta/WhatsApp webhooks deduplicated, secret hygiene verified. |
| [`security-verification-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/security-verification-results-fresh.txt) | 2026-10-16 23:47 | TC-SEC-01 to TC-SEC-17 | 17/17 security tests passed (100% pass rate). Enterprise headers, PII redaction, IDOR defense, brute-force rate limiting (429), WebSocket anti-spoofing verified. |
| [`security-p2-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/security-p2-results-fresh.txt) | 2026-10-16 23:48 | Phase 2 Security Matrix | 17/17 Phase 2 security tests passed (100% pass rate). Token blacklisting, token refresh, RBAC matrix, IDOR protection, phone masking, credential purge verified. |
| [`security-gap-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/security-gap-results-fresh.txt) | 2026-10-16 23:48 | Phase 2 Gap Remediation | 16/16 security gap tests passed (100% pass rate). WebSocket agent auth, JWT claim enforcement, data isolation, carrier HMAC signature check verified. |
| [`regression-test-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/regression-test-results-fresh.txt) | 2026-10-16 23:49 | TC-REG-01 to TC-REG-05 | 5/5 regression tests passed (100% pass rate). Root & telephony uptime, agent auth, lead queryability, inbound webhook acknowledgment, 404 routing verified. |
| [`e2e-workflow-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/e2e-workflow-results-fresh.txt) | 2026-10-16 23:49 | TC-E2E-01 to TC-E2E-05 | 5/5 E2E steps passed (100% pass rate). Full lifecycle from carrier inbound call webhook to agent routing, call termination, and CRM lead correlation verified. |
| [`uat-scenarios-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/uat-scenarios-results-fresh.txt) | 2026-10-17 00:05 | TC-UAT-01 to TC-UAT-07 | 21/21 UAT scenario steps passed (100% pass rate). All 7 business scenarios verified with authenticated Super Admin session (`Raghav@uec.com`). |
| [`accessibility-audit-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/accessibility-audit-results-fresh.txt) | 2026-10-16 23:38 | TC-A11Y-01 | 134/134 components passed with 0 violations. 100% WCAG 2.2 AA compliant. 0 violations across 42 inputs, 43 selects, 11 textareas, 44 buttons, 17 tables, 19 catch blocks. |
| [`staged-concurrency-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/staged-concurrency-results-fresh.txt) | 2026-10-16 23:51 | TC-PERF-01 | 6/6 stages passed provisional SLA (up to 100 VUs). 350 requests executed. Error rate 0.00%. p95 at 50 VUs: 1508ms; p95 at 100 VUs: 2122ms. |
| [`soak-test-results-fresh.txt`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/evidence/soak-test-results-fresh.txt) | 2026-10-16 23:51 | TC-PERF-02 | 8/8 cycles passed at 25 VUs. 200 requests executed in 10.02s. Sustained 19.95 req/sec. Error rate 0.00%. Overall p95: 1717ms. Capacity Verdict: PASS. |

---

## 2. Master Deliverables Directory

All finalized release deliverables are saved in [`qa_release_audit/`](file:///d:/Testing/Crm_summary%20working/qa_release_audit):

1. [`EXECUTIVE_QA_ASSESSMENT.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/EXECUTIVE_QA_ASSESSMENT.md) — Executive release verdict, quality scorecard, dimension evaluations, and release decision.
2. [`MASTER_TEST_CASES.csv`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/MASTER_TEST_CASES.csv) — 79 reconciled test case specifications with dual execution and application quality classifications.
3. [`DEFECT_REGISTER.csv`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/DEFECT_REGISTER.csv) — 34 verified defects (DEF-01 to DEF-34) with root causes, reproductions, recommended fixes, and retest statuses.
4. [`TEST_EXECUTION_SUMMARY.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/TEST_EXECUTION_SUMMARY.md) — Mathematical execution reconciliation, category breakdowns, and defect distributions.
5. [`TEST_EVIDENCE_VALIDATION.csv`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/TEST_EVIDENCE_VALIDATION.csv) — Audited validation matrix verifying claims, test locations, discrepancies, and 100% confidence.
6. [`REQUIREMENT_TO_TEST_TRACEABILITY.csv`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/REQUIREMENT_TO_TEST_TRACEABILITY.csv) — Traceability mapping across 17 requirement domains, 79 test cases, and release compliance verdicts.
7. [`SECURITY_ASSESSMENT.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/SECURITY_ASSESSMENT.md) — Comprehensive OWASP vulnerability assessment, defense mechanisms, and PASS gate verdict.
8. [`PERFORMANCE_AND_CAPACITY_REPORT.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/PERFORMANCE_AND_CAPACITY_REPORT.md) — Staged concurrency distributions (1–100 VUs), soak endurance metrics, and connection pool behavior.
9. [`ACCESSIBILITY_AND_USABILITY_REPORT.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/ACCESSIBILITY_AND_USABILITY_REPORT.md) — WCAG 2.2 AA audit across 134 frontend components and responsive viewport verification.
10. [`REGRESSION_AND_RELEASE_GATE_REPORT.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/REGRESSION_AND_RELEASE_GATE_REPORT.md) — Reconciled evaluation of all 7 enterprise release acceptance gates.
11. [`UAT_CHECKLIST.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/UAT_CHECKLIST.md) — 7 role-based business acceptance scenarios verified with live Super Admin session (`Raghav@uec.com`).
12. [`EVIDENCE_INDEX.md`](file:///d:/Testing/Crm_summary%20working/qa_release_audit/EVIDENCE_INDEX.md) — Environment metadata, raw evidence index, and master deliverable links.
