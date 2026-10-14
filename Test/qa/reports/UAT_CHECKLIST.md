# PARAMANTRA / ELDERCARE CRM — USER ACCEPTANCE TESTING (UAT) SCENARIOS & CHECKLIST

**Document Version:** 1.0  
**Audit Date:** October 13, 2026  
**Auditor / Lead:** Senior UAT & QA Architect  
**Sign-off Status:** **PENDING BUSINESS STAKEHOLDER SIGN-OFF** (QA Audit Verdict: Not Passed)  

> [!IMPORTANT]
> Formal User Acceptance Testing requires business stakeholder review and verification. In accordance with audit standards, QA execution alone does not constitute business sign-off. Because critical underlying APIs and security guards failed technical audit, all dependent UAT scenarios are evaluated as **FAIL** or **BLOCKED**.

---

## 1. Role-Based UAT Scenarios

### Scenario UAT-01: Administrator Creates Care Agent & Assigns Department Permissions
- **User Role:** Super Administrator / Organization Admin
- **Business Requirement:** Administrator must be able to onboard new care staff, assign roles (`ADMIN`, `AGENT`, `SUPERVISOR`), and set operational departments (e.g. Memory Care, Assisted Living).
- **Preconditions:** Administrator is logged in with valid enterprise session.
- **Test Data:** Name: "Anita Sharma", Email: "anita.s@eldercare.org", Role: "AGENT", Dept: "Palliative Care".
- **Steps:**
  1. Navigate to `/admin/users` or `/settings`.
  2. Click "Add User" button.
  3. Fill out profile details and submit.
- **Expected Result:** New agent record persists in database; agent receives invite email; agent appears in active roster.
- **Actual Result:** **BLOCKED**. Settings and user administration pages in `CRM/Frontend/` render static mock forms without backend mutation hooks (DEF-10).
- **UAT Status:** **BLOCKED (P1)**
- **Stakeholder Decision:** REJECTED pending backend form wiring.

---

### Scenario UAT-02: Care Coordinator Claims Unassigned Elder Patient Lead
- **User Role:** Intake Coordinator / Agent
- **Business Requirement:** Intake staff must be able to view incoming patient care inquiries and assign ownership to themselves to prevent double-handling.
- **Preconditions:** Lead records exist in unassigned status.
- **Test Data:** Patient Lead: "Ramesh Gupta", Status: "NEW", Priority: "HIGH".
- **Steps:**
  1. Navigate to `/agent/leads` or `/leads`.
  2. Select patient lead from queue.
  3. Click "Claim Lead" button.
- **Expected Result:** Lead status changes to "CONTACTED"; owner changes to current agent; updates reflected immediately.
- **Actual Result:** **BLOCKED**. Frontend `useLeadStore.ts` targets non-existent route `/leads` (returns HTTP 404), causing silent failure or stale display (DEF-05).
- **UAT Status:** **BLOCKED (P1)**
- **Stakeholder Decision:** REJECTED pending route prefix alignment.

---

### Scenario UAT-03: Inbound Telephony Call Handling & Live WebRTC Audio Bridge
- **User Role:** Call Center Agent
- **Business Requirement:** When a family member calls the eldercare emergency line, the call must route to an available agent's softphone, bridge bidirectional audio, and log the call session.
- **Preconditions:** Agent status is "Available", carrier (Vobiz) sends webhook.
- **Test Data:** Caller: "+919876543210", Agent: "Mani", Trunk ID: "vobiz-trunk-1".
- **Steps:**
  1. Carrier posts incoming webhook to `/vobiz/incoming`.
  2. Backend resolves available agent.
  3. Softphone receives WebRTC SIP / LiveKit room invitation.
  4. Agent answers call.
- **Expected Result:** LiveKit audio session connects; backend returns `<Response><Dial><Sip>...` bridge instructions to carrier.
- **Actual Result:** **FAIL**. Backend returns raw text `'OK'` with `text/xml` header instead of valid carrier dial XML syntax (DEF-09). LiveKit audio bridge cannot establish without valid XML carrier response.
- **UAT Status:** **FAIL (P1)**
- **Stakeholder Decision:** REJECTED pending carrier XML bridge implementation.

---

### Scenario UAT-04: Patient Appointment Scheduling & Calendar Synchronization
- **User Role:** Care Coordinator
- **Business Requirement:** Staff can schedule home nurse visits or doctor consultations and view them on the shared calendar.
- **Preconditions:** Patient and Nurse exist in system.
- **Test Data:** Date: 2026-10-15 10:00 AM, Type: "Home Nurse Consultation", Patient: "Savitri Devi".
- **Steps:**
  1. Navigate to `/calendar` or `/appointments`.
  2. Select time slot and click "Book Appointment".
- **Expected Result:** Appointment saved in database; appears on calendar grid.
- **Actual Result:** **FAIL**. Both `/calendar` and `/api/v1/appointments/calendar` return HTTP 404 due to backend route misconfiguration (`/appointments/calendar`) (DEF-07).
- **UAT Status:** **FAIL (P2)**
- **Stakeholder Decision:** REJECTED pending calendar route harmonization.

---

### Scenario UAT-05: Omnichannel Messaging Dispatch (WhatsApp / SMS)
- **User Role:** Care Coordinator
- **Business Requirement:** Send WhatsApp reminders to patient families regarding medication schedules and care updates.
- **Preconditions:** Omnichannel chat window active.
- **Test Data:** Message: "Reminder: Physiotherapy session scheduled for 3:00 PM today."
- **Steps:**
  1. Open Omnichannel chat.
  2. Type message and click "Send".
- **Expected Result:** Message dispatched to external WhatsApp API and delivery receipt displayed.
- **Actual Result:** **FAIL**. Message dispatch is simulated via client-side `setTimeout` (DEF-13). No outbound provider dispatch occurs.
- **UAT Status:** **FAIL (P1)**
- **Stakeholder Decision:** REJECTED pending true provider integration.

---

### Scenario UAT-06: Supervisor Operational KPI Dashboard Review
- **User Role:** Operations Manager / Clinical Supervisor
- **Business Requirement:** Supervisor reviews daily call volume, average handle time, and service level metrics.
- **Preconditions:** Completed calls and leads exist.
- **Steps:**
  1. Log in as Supervisor and view `/admin/dashboard`.
- **Expected Result:** KPIs display real aggregated database figures.
- **Actual Result:** **FAIL**. `/dashboard/analytics` returns HTTP 404; store silently falls back to hardcoded mock numbers (`14`, `3`, `04:22`, `94%`) (DEF-06).
- **UAT Status:** **FAIL (P1)**
- **Stakeholder Decision:** REJECTED due to false reporting and risk of misleading clinical management.

---

### Scenario UAT-07: Compliance Auditor Accesses Sensitive Call Recording
- **User Role:** Medical Compliance Officer
- **Business Requirement:** Auditor verifies call recording for quality assurance; unauthorized users cannot access recordings.
- **Preconditions:** Call recording stored in Supabase Storage.
- **Steps:**
  1. Request recording audio file at `/telephony/calls/:callId/recording`.
  2. Test with and without valid login session.
- **Expected Result:** Unauthenticated requests rejected with HTTP 401; authenticated auditor receives signed audio stream.
- **Actual Result:** **FAIL (SECURITY RISK)**. Unauthenticated anonymous HTTP requests can access the recording endpoint without a Bearer token (DEF-03).
- **UAT Status:** **FAIL (P0)**
- **Stakeholder Decision:** REJECTED due to severe patient privacy violation.

---

## 2. UAT Summary Scorecard

| Scenario ID | Business Workflow | Result | Blocker Category |
| :--- | :--- | :---: | :--- |
| **UAT-01** | Admin Agent Creation | **BLOCKED** | Static Mock UI |
| **UAT-02** | Lead Claiming & Workflow | **BLOCKED** | Route Prefix 404 Discrepancy |
| **UAT-03** | Inbound Telephony Bridge | **FAIL** | Carrier XML Bridge Missing |
| **UAT-04** | Appointment Scheduling | **FAIL** | Calendar Route 404 |
| **UAT-05** | Omnichannel WhatsApp Dispatch | **FAIL** | Client-side Mock Simulation |
| **UAT-06** | Supervisor KPI Dashboard | **FAIL** | Hardcoded Mock Fallback |
| **UAT-07** | Compliance Recording Access | **FAIL** | Unauthenticated IDOR Vulnerability |

**Sign-off Recommendation:** **DO NOT SIGN OFF.** Application is currently unfit for clinical operations or customer use.
