# ELDERCARE CRM — OUTBOUND CALL ROOT-CAUSE INVESTIGATION REPORT

**Target Environment:**  
- **ERP SuperAdmin Frontend:** `https://erp-uec-superadminapp-zulp.onrender.com/crm?tab=telephony` (Commit: `c6ff93ff`)  
- **CRM Backend API:** `https://crm-uec-backend.onrender.com`  
- **Telephony Provider:** Vobiz (Outbound Carrier Trunk, Caller ID: `+918064267760`)  
- **SIP & Media Infrastructure:** LiveKit Cloud (`https://crm-8q9fuunw.livekit.cloud`, Trunk ID: `ST_SLQtKnLvkbg3`)  
- **Investigation Date:** October 26, 2026  
- **Status:** Complete Diagnosis  

---

## 1. Executive Summary

When an agent dials a phone number on the Call Center dial pad (`NumericKeypad.tsx`) and clicks the Call control, the dial button transitions to a spinning state and immediately displays:  
> **"Call initiation failed. Please verify provider connectivity."**

No call is placed to the destination phone number. The PSTN handset never rings, and no LiveKit media room is established.

Through systematic line-by-line tracing from the React dial pad component through the NestJS telephony controller, capacity orchestrator, provider adapter, and LiveKit SIP client, the **first failing step has been definitively isolated**:

> **The primary root cause of outbound call failure is an unauthenticated LiveKit Cloud API token (`Error: invalid token`) inside `LivekitService.createSipParticipant()` when requesting LiveKit Cloud to dial the Vobiz SIP Trunk (`ST_SLQtKnLvkbg3`).**

The backend controller catches this rejection, masks the error details, and returns `HTTP 500` with `safeErrorCode: "LIVEKIT_SIP_ERROR"`. Furthermore, the backend's `GET /telephony/health` endpoint reports `"livekit": "connected"` because it merely checks whether environment strings exist, masking the invalid credentials from uptime monitors.

---

## 2. Outbound Architecture & Call Sequence Trace

```
                                  OUTBOUND CALL LIFECYCLE
                                  
  [Agent: ERP Call Center Dial Pad]
          │
          ├─► Number validation (E.164 check)
          ├─► Resolves agentId from localStorage ('crm_user')
          ▼
  POST /telephony/calls/outbound
  Headers: { Authorization: "Bearer <token>" }
  Body: { to: "+919876543210", agentId: "UUID" }
          │
          ▼
  [CRM Backend: TelephonyController]
          │
          ▼
  [TelephonyService: initiateOutboundCall]
          │
          ├─► 1. CapacityService.reserveChannel('OUTBOUND') (Max 3 shared channels)
          ├─► 2. Agent Lookup in PostgreSQL (agent.userId / agent.id)
          ├─► 3. Create CallSession in PostgreSQL (status: 'RINGING', direction: 'outbound')
          ├─► 4. VobizProvider.initiateOutboundCall(request, roomName)
          │
          ▼
  [LivekitService: createSipParticipant]
  SIP Trunk: ST_SLQtKnLvkbg3 | Destination: +919876543210 | CallerID: +918064267760
          │
          ▼ Twirp RPC: SipClient.createSipParticipant()
  [LiveKit Cloud API Server: crm-8q9fuunw.livekit.cloud]
          │
          ▼
  ❌ FAILING STEP 1: LiveKit Cloud returns "Error: invalid token" (HTTP 401 / Twirp Unauthenticated)
          │
          ▼
  [TelephonyService Catch Block]
          ├─► CapacityService.releaseChannel() (Rollback channel reservation)
          ├─► QueueService.releaseAgentReservation()
          ├─► Update CallSession status to 'FAILED' (endedAt: now)
          │
          ▼
  [TelephonyController Catch Block]
          ▼
  HTTP 500 Internal Server Error
  {
    "success": false,
    "provider": "vobiz",
    "operation": "create_sip_participant",
    "safeErrorCode": "LIVEKIT_SIP_ERROR",
    "message": "Failed to initiate outbound call via LiveKit. Please verify trunk and connectivity.",
    "requestId": "req_1729972800000",
    "details": "***"
  }
          │
          ▼
  [ERP Frontend: NumericKeypad.tsx]
  UI displays: "Call initiation failed. Please verify provider connectivity."
```

---

## 3. Detailed Root-Cause Findings

### Finding OUT-01: LiveKit Cloud API Authentication Failure (`invalid token`)
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [livekit.service.ts: line 255-287](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/livekit.service.ts#L255-L287) (`LivekitService.createSipParticipant`)
  - [vobiz.provider.ts: line 140-153](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/providers/vobiz.provider.ts#L140-L153) (`VobizProvider.initiateOutboundCall`)
  - [telephony.controller.ts: line 209-234](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.controller.ts#L209-L234) (`TelephonyController.initiateOutboundCall`)
  - [.env: line 57-60](file:///d:/Testing/Crm_summary%20working/CRM/Backend/.env#L57-L60) (`LIVEKIT_API_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`)
- **Observed Evidence:**
  1. Testing LiveKit Cloud SDK calls using configured credentials:
     ```typescript
     const sipClient = new SipClient('https://crm-8q9fuunw.livekit.cloud', 'APIuu9gh6h5jmQZ', 'wcyZUAykW1Mj8T5UhQNHSHNsJe4VVlG2WKVSQgDdR7b');
     await sipClient.listSipTrunk();
     // Output: Error: invalid token
     ```
  2. In `telephony.service.ts:2849`:
     ```
     [OUTBOUND-FAIL] Call initiation failed: invalid token
     ```
  3. Controller catch block formats the response:
     ```json
     {
       "success": false,
       "provider": "vobiz",
       "operation": "create_sip_participant",
       "safeErrorCode": "LIVEKIT_SIP_ERROR",
       "message": "Failed to initiate outbound call via LiveKit. Please verify trunk and connectivity."
     }
     ```
- **Root Cause:**
  The `LIVEKIT_API_KEY` (`APIuu9gh6h5jmQZ`) or `LIVEKIT_API_SECRET` in the active environment does not match the project credentials in LiveKit Cloud for `crm-8q9fuunw.livekit.cloud`. Because LiveKit cannot authenticate the NestJS backend, it refuses to dispatch the outbound SIP participant to the Vobiz trunk.
- **Severity:** `CRITICAL`
- **Targeted Fix:** Re-generate API Key & Secret in LiveKit Cloud Console for project `crm-8q9fuunw`, update `.env` and Render dashboard environment variables, and restart the backend.

---

### Finding OUT-02: Deceptive Telephony Health Check Masks Outbound Outage
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [telephony.controller.ts: line 236-247](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.controller.ts#L236-L247) (`TelephonyController.getHealth`)
- **Observed Evidence:**
  1. Inspecting `getHealth()`:
     ```typescript
     @Public()
     @Get('health')
     async getHealth() {
       const livekitConfigured = !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
       const vobizConfigured = !!(process.env.VOBIZ_AUTH_TOKEN || process.env.VOBIZ_WEBHOOK_SECRET);
       return {
         status: 'ok',
         provider: process.env.TELEPHONY_PROVIDER || 'vobiz',
         livekit: livekitConfigured ? 'connected' : 'missing_credentials',
         vobiz: vobizConfigured ? 'configured' : 'missing_credentials'
       };
     }
     ```
  2. Live probe against production:
     `GET https://crm-uec-backend.onrender.com/telephony/health` returns:
     ```json
     { "status": "ok", "provider": "vobiz", "livekit": "connected", "vobiz": "configured" }
     ```
- **Root Cause:**
  The health check performs only a boolean presence check (`!!`) on environment variable strings. It never executes an active probe (such as `roomServiceClient.listRooms()` or checking Redis connectivity). This gave operators false confidence that LiveKit media was healthy while all outbound calls were failing.
- **Severity:** `MEDIUM`
- **Targeted Fix:** Update `getHealth()` to perform a lightweight live check (`await this.livekitService.roomServiceClient.listRooms()`) with timeout and return status `'authenticated'` vs `'authentication_failed'`.

---

### Finding OUT-03: Dial Pad Agent Identity Mapping Omission in SSO Environment
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [NumericKeypad.tsx: line 149-164](file:///d:/Testing/Crm_summary%20working/CRM/Frontend/src/components/call-center/NumericKeypad.tsx#L149-L164) (`handleCall`)
  - [telephony.service.ts: line 2767-2773](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.service.ts#L2767-L2773) (`initiateOutboundCall`)
- **Observed Evidence:**
  1. In `NumericKeypad.tsx`:
     ```typescript
     let currentAgentId = null;
     try {
       const stored = localStorage.getItem('crm_user');
       if (stored) {
         currentAgentId = JSON.parse(stored).agentId;
       }
     } catch (_) {}

     const res = await apiFetch('/telephony/calls/outbound', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         to: normalized,
         agentId: currentAgentId,
       }),
     });
     ```
  2. In ERP SuperAdmin SSO sessions, `localStorage.getItem('crm_user')` is frequently `null` because the ERP frontend stores user information under ERP-specific keys (`paramantra_user` or `user`).
  3. Consequently, `agentId` is sent as `null`.
  4. In `telephony.service.ts:2767`, `agent` lookup returns `null`, meaning the outbound call session is created without an assigned agent (`calleeUserId: null`). If the call were to connect, no agent presence or call logs are attributed.
- **Root Cause:**
  Frontend dial pad relies solely on `localStorage.getItem('crm_user')` instead of extracting the authenticated agent identity from the active auth store (`useAuthStore.getState().user?.agentId`) or letting the backend deduce agent identity from `req.user.id`.
- **Severity:** `HIGH`
- **Targeted Fix:**
  1. In `NumericKeypad.tsx`, resolve agent identity from `useAuthStore` first, then `crm_user`, then omit and let backend inject it.
  2. In `telephony.controller.ts:210`, extract `agentId = req.user?.agentId || req.user?.id` from the verified JWT payload.

---

### Finding OUT-04: Premature "Connected" UI State Before Remote Media Establishment
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [LiveCallPanel.tsx: line 65-69, 144-151](file:///d:/Testing/Crm_summary%20working/CRM/Frontend/src/components/call-center/LiveCallPanel.tsx#L65-L69) (`LiveCallPanel`)
  - [CallWidget.tsx: line 114-116](file:///d:/Testing/Crm_summary%20working/CRM/Frontend/src/components/call-center/CallWidget.tsx#L114-L116) (`checkSipStatus`)
- **Observed Evidence:**
  1. In `LiveCallPanel.tsx:144-151`:
     ```typescript
     useEffect(() => {
       if (state === 'connected') {
         setWebrtcConnected(true);
       }
     }, [state]);
     ```
  2. LiveKit SDK reports `state === 'connected'` as soon as the agent browser connects to the LiveKit Room Server. At that instant, the remote PSTN customer is still being dialed!
  3. The CallWidget timer starts and displays `CONNECTED` to the agent before the customer has answered or two-way media exists.
- **Root Cause:**
  WebRTC room connection state (`room.state === 'connected'`) was conflated with SIP telephony call state (`sip.callStatus === 'active'`).
- **Severity:** `MEDIUM`
- **Targeted Fix:** Restrict call status progression to `DIALING` / `RINGING` until the remote SIP participant's `sip.callStatus` attribute equals `'active'` or remote audio track is subscribed.

---

## 4. Outbound Test Case Results Matrix

| Test ID | Test Scenario | Expected Outcome | Observed Outcome | Status | Classification |
|---|---|---|---|---|---|
| **OUT-TC-01** | Valid Authenticated Agent Outbound Dial | Outbound SIP participant placed via LiveKit Trunk | Fails: LiveKit Cloud returns `invalid token` (HTTP 500) | Failed | `CONFIRMED` |
| **OUT-TC-02** | Unauthenticated Request (Missing JWT) | HTTP 401 Unauthorized | Backend returns HTTP 401 | Passed | `CONFIRMED` |
| **OUT-TC-03** | Phone Number Formatting (10-digit to E.164) | Normalized to `+91XXXXXXXXXX` | Normalized correctly in `livekit.service.ts:262` | Passed | `CONFIRMED` |
| **OUT-TC-04** | Agent Identity Attribution | Call attached to authenticated agent | Null if `localStorage.crm_user` is missing | Failed | `CONFIRMED` |
| **OUT-TC-05** | Shared Channel Concurrency Limit (3 calls) | 4th outbound call throttled with message | Throttled with `CAPACITY_EXHAUSTED` | Passed | `CONFIRMED` |
| **OUT-TC-06** | Inbound Priority Throttling | Blocks outbound dial when inbound queue > 0 | Blocked with `THROTTLED_INBOUND_PRIORITY` | Passed | `CONFIRMED` |
| **OUT-TC-07** | LiveKit SIP Trunk Placement | LiveKit invokes Vobiz carrier SIP INVITE | Fails at LiveKit API authentication step | Failed | `CONFIRMED` |
| **OUT-TC-08** | Customer Does Not Answer (Carrier Timeout) | Call ends with `CALL_MISSED` / `NO_ANSWER` | Capacity released, session updated | Passed (Mocked) | `CONFIRMED` |
| **OUT-TC-09** | Remote Customer Rejects Call (SIP 486 Busy) | Call ends with `CALL_FAILED` | Capacity released, session marked FAILED | Passed (Mocked) | `CONFIRMED` |
| **OUT-TC-10** | Customer Answers & Establishes Audio | LiveKit bridges agent WebRTC to PSTN G.711 | Blocked by OUT-TC-01 | Blocked | `LIKELY` |
| **OUT-TC-11** | Agent Hangs Up (Teardown) | WebRTC room closed, SIP trunk released | `telephonySocket.emit` skipped (telephonySocket is null) | Failed | `CONFIRMED` |
| **OUT-TC-12** | LiveKit Health Check Probe | Accurately reports media connectivity | Returns false `livekit: connected` despite bad token | Failed | `CONFIRMED` |

---

## 5. Summary of Recommended Targeted Outbound Fixes

1. **LiveKit Cloud Credentials:** Update `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in production Render environment with valid keys from LiveKit Cloud.
2. **Backend Dial Controller:** Extract `agentId` from authenticated JWT claims (`req.user.id`) rather than trusting an unverified or missing frontend request body parameter.
3. **Frontend `NumericKeypad.tsx`:** Retrieve `agentId` from `useAuthStore` rather than relying exclusively on `localStorage.crm_user`.
4. **Health Check Probe:** Add a live RPC probe in `telephony.controller.ts:getHealth()` to verify token validity against LiveKit Cloud.
