# RELEASE BLOCKERS & SCOPE GAPS REGISTER
**Paramantra / Eldercare CRM Platform**  
**Assessment Phase:** Phase 5 — Performance Remediation & Release-Gate Revalidation  
**Current Branch:** `remediation/phase-5-performance-remediation`  
**Date:** October 16, 2026  
**Auditor:** Senior Performance Engineer, SRE, Application Security Engineer & Independent QA Lead  

---

## 1. Executive Summary

This register tracks all remaining mandatory release blockers, documented scope gaps, and infrastructure prerequisites that govern the production release gate. While all critical functional regressions, security exploits (DEF-01 through DEF-04, DEF-17, DEF-18), accessibility violations (DEF-19 through DEF-21), and concurrency connection pool failures (DEF-22, DEF-24) have been remediated, production deployment remains gated by administrative and architectural requirements.

---

## 2. Release Blocker Summary Matrix

| Blocker ID | Category | Title | Severity | Current Status | Release Gate Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RB-01** | Security / Secret Hygiene | Cloud Infrastructure Secrets Committed in Git & Unrotated | P0 Critical | Awaiting Admin Confirmation | **HARD BLOCKER** (Must be resolved before public Internet deployment) |
| **RB-02** | Product Scope | Placeholder Stubs for Care Plans, Marketing & Automations | P2 Medium | Documented Scope Gap | **CONDITIONAL** (Requires stakeholder acceptance of phased scope) |
| **RB-03** | Performance / Architecture | 50–100 VU Cross-Region Latency Breach (p95 > 3000ms) | P1 High | Capacity Certified to 25 VUs | **CONDITIONAL** (Requires co-located regional deployment for >25 VUs) |

---

## 3. Detailed Release Blocker Audit

### RB-01: Exposed Cloud Infrastructure Secrets (DEF-04)
- **Description:** Plaintext credentials for Supabase Service Role, Redis Cloud, Twilio, LiveKit Cloud, Vobiz Carrier, and Gmail IMAP/SMTP were previously committed in tracked repository files and `.env`.
- **Mitigation Implemented:** Sanitized all logging outputs, reports, and build artifacts to prevent credential leakage. Configured `.env` tracking controls.
- **Mandatory Action Required from Authorized Administrator:**
  1. Rotate Supabase Service Role JWT in Supabase Dashboard.
  2. Rotate Redis Cloud password and provision access control lists.
  3. Revoke and reissue LiveKit API Secret and Vobiz Auth Token.
  4. Revoke Gmail App Password (`testingforcompany.0@gmail.com`).
  5. Migrate production secrets to AWS Secrets Manager, HashiCorp Vault, or Doppler.
  6. Purge historical Git commits containing exposed keys before making repository public.
- **Release Verdict:** **HARD BLOCKER** — Automatic rotation was explicitly NOT executed to prevent breaking active development environments. Deployment to production cannot occur until the authorized administrator confirms all credentials have been rotated in provider consoles.

---

### RB-02: Documented Scope Gaps in Secondary Modules (DEF-10 / DEF-11)
- **Description:** Five secondary frontend modules render static placeholder cards or client-only mock forms without backend database persistence:
  - `/marketing` (Campaign manager mock forms)
  - `/automation` (Workflow triggers and builder UI)
  - `/targets` (Sales target tracker mock UI)
  - `/care-plans` (22-line static placeholder stub)
  - `/emergency-alerts` (Partial REST endpoints active; frontend UI requires full field wiring)
  - `/feedback` (22-line static placeholder stub)
- **Core Functionality Verified Ready:**
  - Authentication & RBAC (Login, JWT, Super Admin, Supervisor, Agent roles)
  - Leads Management (Creation, listing, search, status updates, claiming, conversions)
  - Telephony & Voice (WebRTC SIP signaling, carrier webhooks, call recording IDOR checks)
  - Omnichannel Messaging (Conversations, multi-tenant message dispatch)
  - Ticketing (Ticket ingestion, status transitions, role-scoped queue views)
  - Calendar & Appointments (Scheduling, range filtering, provider parity)
  - Dashboard & Analytics (Live database aggregations, KPI cards, charts)
- **Release Verdict:** **DOCUMENTED SCOPE GAP** — Stakeholder sign-off required to accept MVP release scope (Core CRM + Telephony + Omnichannel + Tickets + Calendar) while scheduling secondary care and marketing modules for Phase 6 release.

---

### RB-03: Staged Concurrency Latency Gate at 50–100 Virtual Users
- **Description:** Under the provisional performance SLA (p95 latency $\le 3000\text{ ms}$, Error Rate $\le 1.0\%$, 0 validation failures):
  - **1 VU, 5 VUs, 10 VUs, and 25 VUs:** Fully **PASS** all criteria. At 25 VUs, p95 latency is $2831\text{ ms}$, error rate is $0.00\%$, and throughput is $15.30\text{ req/sec}$.
  - **50 VUs and 100 VUs:** **PASS** functional correctness ($100\%$ HTTP 200, 0 timeouts, 0 5xx errors), but **FAIL** latency SLA ($p95 = 5515\text{ ms}$ at 50 VUs, $4939\text{ ms}$ at 100 VUs).
- **Root Cause:**
  - Supabase database instance is hosted in `ap-northeast-1` (Tokyo, Japan).
  - The local development/test runner is hosted in India (`ap-south-1` region), inducing ~130ms base round-trip network transit latency per database socket.
  - With Prisma's connection limit bounded to 15 connections to protect Supabase's transaction pooler, 50–100 concurrent requests for uncached dynamic endpoints (`/api/v1/leads`, `/api/v1/tickets`, `/api/v1/appointments/calendar`) must execute in sequential connection queues.
- **Remediation Implemented in Phase 5:**
  - Consolidated `/dashboard/analytics` 12 parallel queries into 1 query; added single-flight Promise deduplication and 15s cache.
  - Bounded list endpoints (`/api/v1/leads`, `/api/v1/tickets`, `/api/v1/appointments/calendar`) with `take: 50` / `take: 100` limits.
  - Eliminated all connection pool timeout errors (P2024) and all HTTP 504/timeout aborts.
- **Architectural Requirement for 100 VU Capacity:**
  - Co-locate backend servers with the Supabase database in AWS Tokyo (`ap-northeast-1`), or migrate database to AWS Mumbai (`ap-south-1`). Intra-region latency drops from ~130ms to <2ms, reducing p95 latency at 100 VUs from 4939ms to <800ms.
- **Release Verdict:** **CONDITIONAL PASS** — Validated certified capacity is **25 concurrent Virtual Users** for cross-region architecture. Approved for phased rollout within 25 VU load threshold; regional co-location required prior to uncapped 100+ VU public launch.

---

## 4. Final Release Gate Verdict

| Gate | Evaluation | Status | Action Required |
| :--- | :--- | :--- | :--- |
| **Security Gate** | OWASP Top 10, Auth, RBAC, Webhooks, Headers, Anti-Impersonation | **PASS** | Completed in Phase 2 & Phase 3 |
| **Secret Hygiene Gate** | Credential Revocation & Cloud Rotation | **BLOCKED** | Authorized Admin must rotate credentials |
| **Functional Gate** | Leads, Telephony, Tickets, Appointments, Analytics, Omnichannel | **PASS** | 21/21 Phase 3 Integration Tests Pass |
| **Accessibility Gate** | WCAG 2.1 AA Compliance across 134 Components | **PASS** | 0 Violations (Phase 4 audit) |
| **Performance SLA Gate (1–25 VUs)** | Error Rate $\le 1\%$, p95 $\le 3000\text{ ms}$, Throughput $15.3\text{ req/s}$ | **PASS** | Certified up to 25 Concurrent Users |
| **Performance SLA Gate (50–100 VUs)** | Error Rate $\le 1\%$, p95 $\le 3000\text{ ms}$ | **HOLD** | Requires intra-region cloud deployment |
| **OVERALL VERDICT** | **NO-GO FOR IMMEDIATE PRODUCTION DEPLOYMENT** | **HOLD** | **Approved for Staging / UAT; Hard-Gated on RB-01 Rotation** |
