# PARAMANTRA / ELDERCARE CRM — TEST EXECUTION SUMMARY

**Audit Date:** October 13, 2026  
**Auditor / Role:** Principal QA Architect & Lead Automation Engineer  
**Target Environment:** Local Isolated Environment (Node.js v24.20.0, Windows 10, Port 4000)  
**Target Repositories:**  
- Frontend: `CRM/Frontend/` (Next.js 14 App Router, TypeScript, Tailwind CSS)  
- Backend: `CRM/Backend/` (NestJS Unified Architecture, Prisma ORM, LiveKit, Vobiz)  
- Legacy Service: `CRM/Backend-call service/` (Express / Prisma legacy service)  

---

## 1. High-Level Execution Statistics

| Metric | Value | Definition & Formula |
| :--- | :--- | :--- |
| **Total Planned Test Cases** | **40** | Total formal test specifications cataloged in `TEST_CASES.csv` |
| **Total Executed Test Cases** | **38** | Test cases physically executed against live runtime or code |
| **Passed Tests (PASS)** | **21** | Expected behavior verified with hard execution evidence |
| **Failed Tests (FAIL)** | **17** | Actual behavior diverged from requirement or risk check failed |
| **Blocked Tests (BLOCKED)** | **2** | Blocked by prerequisite failures (UI route 404 / static mock forms) |
| **Not-Run Tests (NOT RUN)** | **0** | All scheduled audit cases were processed |
| **Not Applicable (N/A)** | **0** | Out-of-scope tests excluded prior to test design |
| **Inconclusive (INCL)** | **0** | All executed tests had unambiguous deterministic outcomes |
| **Execution Rate** | **95.0%** | $(38 / 40) \times 100$ |
| **Pass Rate (of Executed)** | **55.3%** | $(21 / 38) \times 100$ |
| **Effective Release Pass Rate** | **52.5%** | $(21 / 40) \times 100$ (accounting for blocked tests) |

---

## 2. Test Execution Breakdown by Category

| # | Testing Category | Planned | Executed | Pass | Fail | Blocked | Execution Evidence Location |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :--- |
| 1 | **Smoke Testing** | 8 | 8 | 4 | 4 | 0 | `qa/evidence/api-results/smoke-test-results.txt` |
| 2 | **Unit Testing** | 8 | 8 | 5 | 3 | 0 | `qa/evidence/api-results/unit-test-results.txt` |
| 3 | **Integration Testing** | 7 | 7 | 4 | 3 | 0 | `qa/evidence/api-results/integration-test-results.txt` |
| 4 | **Security Testing** | 6 | 6 | 1 | 5 | 0 | `qa/evidence/api-results/security-test-results.txt` |
| 5 | **Accessibility Testing** | 3 | 3 | 0 | 3 | 0 | `qa/evidence/api-results/accessibility-audit-results.txt` |
| 6 | **Performance / Load Testing** | 3 | 3 | 1 | 2 | 0 | `qa/evidence/api-results/load-test-results.txt` |
| 7 | **Stress Testing** | 1 | 1 | 1 | 0 | 0 | `qa/evidence/api-results/stress-test-results.txt` |
| 8 | **Regression Testing** | 5 | 5 | 5 | 0 | 0 | `qa/evidence/api-results/regression-test-results.txt` |
| 9 | **End-to-End (E2E) Workflow** | 1 | 1 | 1 | 0 | 0 | `qa/evidence/api-results/e2e-workflow-results.txt` |
| 10 | **Acceptance Testing (UAT)** | 4 | 2 | 0 | 2 | 2 | Manual UI Inspection & Verification |
| **TOTAL** | | **40** | **38** | **21** | **17** | **2** | |

---

## 3. Defect Metrics & Severity Distribution

All 16 primary defects cataloged in `qa/reports/DEFECT_REGISTER.csv` plus newly detected security/a11y defects:

| Severity Level | Count | Share (%) | Status | Production Blocker? |
| :--- | :-: | :-: | :---: | :---: |
| **P0 Critical** | **5** | 22.7% | OPEN | **YES — IMMEDIATE BLOCKER** |
| **P1 High** | **8** | 36.4% | OPEN | **YES — RELEASE BLOCKER** |
| **P2 Medium** | **6** | 27.3% | OPEN | **YES — WORKAROUND REQUIRED** |
| **P3 Low** | **3** | 13.6% | OPEN | NO (Target next sprint) |
| **TOTAL OPEN DEFECTS** | **22** | **100%** | **22 OPEN / 0 CLOSED** | **RELEASE NOT AUTHORIZED** |

### P0 Critical Defects Summary:
1. **DEF-01:** Plaintext password hash login bypass & mock static JWT token in `auth.controller.ts`.
2. **DEF-02:** Public unauthenticated access to `/api/v1/agents` exposing agent PII.
3. **DEF-03:** IDOR vulnerability and lack of authentication on `/telephony/calls/:callId/recording`.
4. **DEF-04:** Plaintext production credentials committed in `CRM/Backend/.env` (Supabase Service Role, Twilio, LiveKit, Redis).
5. **TC-UNIT-03:** `AuthGuard` returns `true` unconditionally and is not wired to route controllers.

---

## 4. Performance & Load Test Metrics

Workload profile executed against live NestJS server on `http://localhost:4000`:

| Stage | Virtual Users (VUs) | Target Requests | Duration | Throughput (RPS) | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Error Rate (%) | Status |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :---: |
| **Baseline** | 5 | 50 | 2.99s | 16.70 req/s | 14 ms | 681 ms | **2433 ms** | 2482 ms | 0.00% | **FAIL (SLA Breach)** |
| **Moderate** | 10 | 100 | 2.22s | 45.03 req/s | 6 ms | 521 ms | 563 ms | 1862 ms | 0.00% | **PASS** |
| **Elevated** | 25 | 150 | 2.59s | 57.88 req/s | 9 ms | 749 ms | 763 ms | 2562 ms | **2.00%** | **FAIL (>1% Errors)** |

### Bottleneck Analysis:
- **Redis Timeout Degradation:** The baseline stage exhibited a 2433ms p95 latency caused by a remote cloud Redis timeout (`redislabs.com:12592` timeout in `dist/src/legacy/routes/agents.js:39`).
- **Connection Pool Exhaustion:** Under 25 concurrent users, 3 requests threw HTTP 500 errors due to Prisma PostgreSQL connection pooling limits.

---

## 5. Controlled Stress Test & Recovery Results

- **Burst 1 (20 concurrent requests):** Completed in 0.08s, p95 = 25ms, p99 = 73ms, 100% HTTP 200.
- **Burst 2 (35 concurrent requests):** Completed in 0.03s, p95 = 25ms, p99 = 25ms, 100% HTTP 200.
- **Burst 3 (50 concurrent requests):** Completed in 0.03s, p95 = 23ms, p99 = 23ms, 100% HTTP 200.
- **Post-Stress System Recovery:** Single health ping immediately after stress burst responded with **HTTP 200 in 3ms**. The Node.js event loop remained unblocked with zero process crashes.

---

## 6. Accessibility & Frontend Quality Metrics (WCAG 2.2 AA)

- **Total TSX/JSX Components Audited:** 134
- **Accessible Name Violations (`aria-label` missing on icon buttons):** 6 instances (WCAG 4.1.2)
- **Form Controls Missing Programmatic Labels (`<input>` without `<label>` / `id`):** 90 instances (WCAG 1.3.1)
- **Images Missing `alt` Attributes:** 6 instances (WCAG 1.1.1)
- **Low Contrast Flagged Patterns:** 1 instance (WCAG 1.4.3)
- **Dead / Mock UI Buttons:** Present across `Marketing`, `Automation`, `Targets`, and `Settings` pages.
