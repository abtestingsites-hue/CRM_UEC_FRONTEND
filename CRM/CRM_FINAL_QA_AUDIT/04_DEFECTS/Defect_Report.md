# Defect Register & Remediation Audit Report

## 1. Defect Summary
During the comprehensive testing and audit phases, 7 defects were cataloged across telephony, queue processing, UI controls, and dependencies. All 3 critical telephony and recording defects were resolved, committed, and verified with 100% test pass rates.

| Defect ID | Severity | Component | Status | Summary |
|---|---|---|---|---|
| **DEF-01** | P1 | Telephony Recording | **FIXED & RETESTED** | Permanent in-memory lock suppressed recording retries on customer answer |
| **DEF-02** | P1 | Telephony Recording | **FIXED & RETESTED** | Terminal check on `NOT_AVAILABLE` prevented retrying failed starts |
| **DEF-03** | P1 | LiveKit Service | **FIXED & RETESTED** | Unvalidated `egressId` in `startRoomRecording` allowed empty string return |
| **DEF-04** | P0 | BullMQ Worker | **OPEN (ACCEPTED RISK)** | Missing `@Processor('sales_queue')` causes jobs pushed to `sales_queue` to stall |
| **DEF-05** | P2 | ERP Modules | **OPEN (ACCEPTED RISK)** | Invoicing, Billing, and Attendance are schema-only without APIs |
| **DEF-06** | P2 | Frontend UI | **OPEN (ACCEPTED RISK)** | Over 60 buttons on `/automation` & `/settings` lack backend REST persistence |
| **DEF-07** | P2 | Security / Deps | **OPEN (ACCEPTED RISK)** | 27 backend and 16 frontend third-party vulnerabilities from `npm audit` |

---

## 2. Detailed Remediation Records

### DEF-01: Permanent In-Memory Lock Suppresses Recording Retries
- **Root Cause:** `TelephonyService` maintained `recordingAttemptedRooms: Set<string>`. When recording failed due to quota exhaustion, the room was never deleted from the set.
- **Fix Applied:** Replaced permanent set with `recordingStartingInProgress` (in-flight lock) and `recordingRetryAttempts` (capped at 3). Enforced release in a `finally` block.
- **Retest Result:** Verified in `livekit-recording-rootcause.spec.ts` (Test 3 & 4 passed).

### DEF-02: Terminal Check on NOT_AVAILABLE Blocks Retry on Answer
- **Root Cause:** Line 476 checked `callSession.recordingStatus === 'NOT_AVAILABLE'` and returned early. When a customer answered following a transient error, recording could not be re-triggered.
- **Fix Applied:** Modified check to allow up to 3 recoverable retries while the call session remains active (`IN_PROGRESS`, `CONNECTED`).
- **Retest Result:** Verified in `livekit-recording-rootcause.spec.ts` (Test 4 passed).

### DEF-03: Missing Egress ID Validation in LivekitService
- **Root Cause:** `LivekitService.startRoomRecording` returned `info.egressId` without asserting that it was a non-empty string.
- **Fix Applied:** Added explicit assertion throwing `new Error('LiveKit Egress client returned empty egressId')`.
- **Retest Result:** Verified in `livekit-recording-rootcause.spec.ts` (Test 2 passed).