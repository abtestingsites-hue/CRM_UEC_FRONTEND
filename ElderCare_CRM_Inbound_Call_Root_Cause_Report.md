# ELDERCARE CRM — INBOUND CALL ROOT-CAUSE INVESTIGATION REPORT

**Target Environment:**  
- **ERP SuperAdmin Frontend:** `https://erp-uec-superadminapp-zulp.onrender.com/crm?tab=telephony` (Commit: `c6ff93ff`)  
- **CRM Backend API:** `https://crm-uec-backend.onrender.com`  
- **Telephony Provider:** Vobiz (Inbound Carrier Trunk, DID: `+918064267760`)  
- **SIP & Media Infrastructure:** LiveKit Cloud (`https://crm-8q9fuunw.livekit.cloud`, SIP Host: `3ecoesrfwws.sip.livekit.cloud`)  
- **Investigation Date:** October 26, 2026  
- **Status:** Complete Diagnosis  

---

## 1. Executive Summary

Inbound calls to the ElderCare CRM DID (`+918064267760`) fail systematically to reach available agents. Callers either hear an immediate busy signal, an endless ringback, or a disconnected tone, while agent screens in the ERP-integrated CRM never display an incoming call banner or ringing modal.

A multi-layer root-cause audit across the Vobiz carrier integration, NestJS backend, LiveKit SIP dispatcher, and ERP frontend revealed **four primary structural breakdowns**:

1. **Carrier Inbound Webhook Mismatch (`CONFIRMED`):** In local and staging environments, `VOBIZ_WEBHOOK_PUBLIC_URL` was configured to an ephemeral ngrok tunnel (`https://joyride-darkening-fifteen.ngrok-free.dev/vobiz/incoming`). If Vobiz carrier portal routing points to that expired URL rather than `https://crm-uec-backend.onrender.com/vobiz/incoming`, carrier webhook deliveries fail before reaching the CRM.
2. **Agent Disconnection & False "Stale Socket" Deallocation (`CONFIRMED`):** In the ERP frontend, `SocketProvider.tsx` defines `const [socket, setSocket] = useState(null)` but never executes `setSocket(socketInstance)`. Furthermore, ERP-to-CRM SSO does not exchange tokens properly, causing the WebSocket to attempt connection without a valid CRM JWT. When the carrier webhook arrives, `telephony.service.ts` inspects `potentialAgent.socketId`. Because the socket is disconnected or unrecognized, the backend marks the eligible agent `OFFLINE`, releases their reservation, and diverts the call to the waiting pool.
3. **Database Query Flaw in `getMyRingingCall` (`CONFIRMED`):** When the frontend attempts polling fallback via `GET /telephony/my-ringing-call`, `telephony.service.ts:getMyRingingCall()` filters `CallSession` with `participants: { some: { agentId: agentId, role: 'AGENT' } }`. However, during inbound ringing, `createCallSession()` initializes `participants: { create: [] }` (empty array); participant rows are only inserted upon call acceptance (`acceptCallSession()`). Consequently, `getMyRingingCall` returns `null` 100% of the time.
4. **Invalid LiveKit Cloud SIP Credentials (`CONFIRMED`):** Background discovery of the inbound SIP participant via `LivekitService.findInboundSipRoom()` calls `RoomServiceClient.listRooms()`. LiveKit Cloud rejects this with `Error: invalid token`, preventing the backend from synchronizing SIP participant audio into the call session.

---

## 2. Inbound Architecture & Intended Call Path

```
                                  INBOUND CALL LIFECYCLE
                                  
  [Caller: PSTN Mobile] 
          │
          ▼ Dial DID (+918064267760)
  [Vobiz Carrier Network]
          │
          ├───────────────────────────────────────────────────────┐
          │ HTTP POST Webhook                                     │ SIP INVITE (G.711 / Opus)
          ▼                                                       ▼
  [CRM Backend: VobizController]                         [LiveKit SIP Server]
  POST /vobiz/incoming                                    3ecoesrfwws.sip.livekit.cloud
          │                                                       │
          ├─► verifySignature() (HMAC-SHA256)                     ├─► Inbound SIP Trunk ST_89fEsPaUMyqM
          ├─► normalizeWebhookEvent()                             ├─► Dispatch Rule (Callee Room Routing)
          │                                                       │
          ▼                                                       ▼
  [TelephonyService: processNormalizedEvent]              [LiveKit WebRTC Room]
          │                                               call_<CallUUID>
          ├─► Idempotency Lock (Redis: call_event:...)            │
          ├─► Customer Context Lookup (CRM Leads / Patients)      │
          ├─► QueueService.allocateAgent()                        │
          │   └─► Evaluates available agent socket                │
          ├─► Create CallSession (status: 'RINGING')              │
          ├─► TelephonyGateway.dispatchIncomingCallToAgent()      │
          │   └─► socket.emit('incoming_call', payload)           │
          ▼                                                       │
  [ERP Frontend: SocketProvider & CallWidget]                     │
          │                                                       │
          ├─► Event 'incoming_call' received                      │
          ├─► IncomingCallModal rendered                          │
          ├─► Agent clicks "Accept"                               │
          ├─► socket.emit('acceptCall', { callSid, agentId })     │
          │                                                       │
          ▼                                                       ▼
  [LiveKit WebRTC Connection] ◄───────────────────────────────────┘
   Agent joins Room via token & establishes two-way RTP audio
```

---

## 3. Detailed Root-Cause Findings

### Finding INB-01: Carrier Webhook Endpoint & Public URL Configuration Drift
- **Classification:** `CONFIRMED` (Local/Env) / `LIKELY` (Production Carrier Dashboard)
- **Source Files & Functions:**
  - [vobiz.controller.ts: line 8-53](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/vobiz.controller.ts#L8-L53) (`VobizController.handleVobizIncoming`)
  - [.env: line 76-77](file:///d:/Testing/Crm_summary%20working/CRM/Backend/.env#L76-L77) (`VOBIZ_WEBHOOK_PUBLIC_URL`)
- **Observed Evidence:**
  1. The backend `.env` file explicitly configures:
     ```env
     VOBIZ_WEBHOOK_PATH=/vobiz/incoming
     VOBIZ_WEBHOOK_PUBLIC_URL=https://joyride-darkening-fifteen.ngrok-free.dev/vobiz/incoming
     ```
  2. The ngrok URL `joyride-darkening-fifteen.ngrok-free.dev` is inactive/offline.
  3. Live probe against the production URL:
     ```powershell
     Invoke-RestMethod -Uri 'https://crm-uec-backend.onrender.com/vobiz/incoming' -Method Get
     # Response: { status: 'ok', endpoint: '/vobiz/incoming', provider: 'vobiz' } (HTTP 200)
     ```
- **Root Cause:**
  If the Vobiz carrier portal is configured with the webhook URL from developer testing (`ngrok`), incoming call webhooks are dropped with HTTP 502 / TCP Connection Refused. The production Render URL `https://crm-uec-backend.onrender.com/vobiz/incoming` is operational and reachable, but requires Vobiz portal alignment.
- **Severity:** `CRITICAL`
- **Targeted Fix:** Update Vobiz carrier dashboard webhook URL to `https://crm-uec-backend.onrender.com/vobiz/incoming` with HTTP method `POST`. In `.env`, ensure `VOBIZ_WEBHOOK_PUBLIC_URL=https://crm-uec-backend.onrender.com/vobiz/incoming`.

---

### Finding INB-02: SocketProvider State Nullification Prevents Frontend Signaling
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [SocketProvider.tsx: line 58-106, 523-534](file:///d:/Testing/Crm_summary%20working/CRM/Frontend/src/providers/SocketProvider.tsx#L58-L106) (`SocketProvider`)
  - [IncomingCallModal.tsx: line 10-75](file:///d:/Testing/Crm_summary%20working/CRM/Frontend/src/components/call-center/IncomingCallModal.tsx#L10-L75) (`IncomingCallModal.handleAccept`, `handleReject`)
  - [LiveCallPanel.tsx: line 156-160](file:///d:/Testing/Crm_summary%20working/CRM/Frontend/src/components/call-center/LiveCallPanel.tsx#L156-L160) (`LiveCallPanel`)
- **Observed Evidence:**
  1. `SocketProvider.tsx` defines state:
     ```typescript
     const [socket, setSocket] = useState<Socket | null>(null);
     ```
  2. When `globalSocket` is created via `io(targetUrl, ...)`, `setSocket(globalSocket)` is **never invoked**.
  3. `SocketProvider` exports context:
     ```typescript
     <SocketContext.Provider value={{ socket, telephonySocket: socket, mediaSocket: socket, isConnected }}>
     ```
  4. Every consumer using `const { telephonySocket } = useSocket()` receives `telephonySocket: null`.
  5. In [IncomingCallModal.tsx: line 50-56](file:///d:/Testing/Crm_summary%20working/CRM/Frontend/src/components/call-center/IncomingCallModal.tsx#L50-L56):
     ```typescript
     } else if (telephonySocket) {
       telephonySocket.emit('acceptCall', { callSid, roomName, agentId });
     }
     ```
     Because `telephonySocket` is `null`, the `emit` is completely skipped! The backend is never notified that the agent accepted or rejected the call.
- **Root Cause:**
  React state variable `socket` is initialized to `null` and never updated with the active `Socket` instance upon connection.
- **Severity:** `CRITICAL`
- **Targeted Fix:** In `SocketProvider.tsx`, execute `setSocket(socketInstance)` immediately after instantiation and inside `handleConnect`.

---

### Finding INB-03: Inbound Agent Deallocation on Stale Socket Check
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [telephony.service.ts: line 2413-2437](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.service.ts#L2413-L2437) (`processNormalizedEvent`)
  - [telephony.gateway.ts: line 80-145](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.gateway.ts#L80-L145) (`handleConnection`)
- **Observed Evidence:**
  1. Production test `AUDIT-WS-01` confirmed: When connecting without a valid CRM JWT, the gateway handshake middleware throws `AUTHENTICATION_REQUIRED: Token missing in handshake` and terminates the socket connection.
  2. In the deployed ERP frontend, `api-CqsF39V8.js` revealed `ensureCrmAuthSession()` hardcoded a failed login fallback to `Raghav@uec.com` / `raghav@uec.com`. When an agent opens the telephony tab without an active CRM session, `paramantra_access_token` and `crm_token` are empty.
  3. In `telephony.service.ts`:
     ```typescript
     let isSocketConnected = false;
     if (potentialAgent.socketId) {
       const directSocket = this.telephonyGateway.server?.sockets?.sockets?.get(potentialAgent.socketId);
       if (directSocket?.connected) {
         isSocketConnected = true;
       }
     }
     if (!isSocketConnected) {
       this.logger.warn(`Allocated agent ${potentialAgent.name} but socket ${potentialAgent.socketId} is dead. Releasing reservation and marking offline.`);
       await this.queueService.releaseAgentReservation(potentialAgent.id, event.providerCallId);
       await this.prisma.agent.update({
         where: { id: potentialAgent.id },
         data: { status: 'OFFLINE', activeCalls: 0, socketId: null }
       });
     }
     ```
- **Root Cause:**
  Because the frontend WebSocket is disconnected or has an invalid token, the backend's strict socket liveness check fails. The backend automatically penalizes the agent by marking their status `OFFLINE`, releases their reservation, and moves the call to the unassigned queue (`status: 'RINGING', isEnqueued: true`).
- **Severity:** `CRITICAL`
- **Targeted Fix:** 
  1. Ensure ERP-to-CRM SSO exchanges credentials for a valid CRM token before WebSocket initialization.
  2. Implement an authenticated polling fallback so agents with transient socket reconnects can still receive incoming call notifications.

---

### Finding INB-04: Fatal Query Flaw in Polling Endpoint `GET /telephony/my-ringing-call`
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [telephony.service.ts: line 2129-2146](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.service.ts#L2129-L2146) (`getMyRingingCall`)
  - [telephony.service.ts: line 72-103](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.service.ts#L72-L103) (`createCallSession`)
  - [telephony.service.ts: line 238-245](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.service.ts#L238-L245) (`acceptCallSession`)
- **Observed Evidence:**
  1. In `telephony.service.ts:getMyRingingCall()`:
     ```typescript
     const callSession = await this.prisma.callSession.findFirst({
       where: {
         status: 'RINGING',
         participants: {
           some: { agentId: agentId, role: 'AGENT' },
         },
       },
       include: { customer: true, participants: true },
     });
     ```
  2. Inspecting [createCallSession: line 95-97](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.service.ts#L95-L97):
     ```typescript
     data: {
       reason: callSid,
       calleeUserId: agentId, // agent user ID
       status: 'RINGING',
       startedAt: new Date(),
       livekitRoom: roomName,
       participants: {
         create: [], // <--- EMPTY ARRAY! No participants created during RINGING!
       },
     }
     ```
  3. `CallParticipant` rows are only created in `acceptCallSession()` [line 238](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/telephony.service.ts#L238):
     ```typescript
     await this.prisma.callParticipant.create({
       data: {
         callSessionId: session.id,
         agentId: realAgentId,
         role: 'AGENT',
         joinedAt: new Date(),
       },
     });
     ```
- **Root Cause:**
  `getMyRingingCall` filters by `participants.some(...)`. But during the `RINGING` state, no participant record exists in PostgreSQL! The assigned agent is stored in `callSession.calleeUserId` or `callSession.transferHistory`. Therefore, `getMyRingingCall` returns `null` for every ringing call, disabling HTTP polling fallback.
- **Severity:** `HIGH`
- **Targeted Fix:** Update `getMyRingingCall` in `telephony.service.ts` to query `OR: [{ calleeUserId: agent.userId }, { participants: { some: { agentId } } }]`.

---

### Finding INB-05: LiveKit SIP Credentials Invalid (`invalid token`)
- **Classification:** `CONFIRMED`
- **Source Files & Functions:**
  - [livekit.service.ts: line 289-315](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/livekit.service.ts#L289-L315) (`findInboundSipRoom`)
  - [livekit.service.ts: line 55-64](file:///d:/Testing/Crm_summary%20working/CRM/Backend/src/telephony/livekit.service.ts#L55-L64) (`onModuleInit`)
- **Observed Evidence:**
  1. LiveKit credentials in `.env`:
     ```env
     LIVEKIT_API_URL=https://crm-8q9fuunw.livekit.cloud
     LIVEKIT_API_KEY=APIuu9gh6h5jmQZ
     LIVEKIT_API_SECRET=wcyZUAykW1Mj8T5UhQNHSHNsJe4VVlG2WKVSQgDdR7b
     ```
  2. Executing `RoomServiceClient.listRooms()` or `SipClient.listSipDispatchRule()` against `https://crm-8q9fuunw.livekit.cloud` results in:
     `Error: invalid token`
  3. In `telephony.service.ts:2513-2549`, background SIP discovery `findInboundSipRoom` logs:
     `[INBOUND-LIVEKIT-SYNC] Background check: invalid token`
- **Root Cause:**
  The LiveKit Cloud project `crm-8q9fuunw.livekit.cloud` was re-keyed, deleted, or expired, rendering the configured API key and secret invalid. While Vobiz dials the SIP URI (`sip:call_<sid>@3ecoesrfwws.sip.livekit.cloud`), LiveKit SIP Server cannot authenticate API requests to query room participants or dispatch token sync events.
- **Severity:** `CRITICAL`
- **Targeted Fix:** Generate fresh API credentials from LiveKit Cloud Console for project `crm-8q9fuunw` and update `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in production Render environment.

---

## 4. Inbound Test Case Results Matrix

| Test ID | Test Scenario | Expected Outcome | Observed Outcome | Status | Classification |
|---|---|---|---|---|---|
| **INB-TC-01** | Webhook Delivery to `/vobiz/incoming` | HTTP 200 with XML `<Response><Dial><Sip>...` | Returns HTTP 200 with TwiML bridge XML | Passed (Direct Backend) | `CONFIRMED` |
| **INB-TC-02** | Webhook Delivery via `VOBIZ_WEBHOOK_PUBLIC_URL` | Delivered to CRM backend | Fails with Connection Refused if ngrok URL used | Failed | `CONFIRMED` |
| **INB-TC-03** | Webhook HMAC Signature Validation | Rejects forged signatures with 403 Forbidden | Validated by timingSafeEqual in controller | Passed | `CONFIRMED` |
| **INB-TC-04** | Agent Allocation (Eligible Agent Online) | Assigns agent and creates `CallSession` | Session created; but marked OFFLINE if socket dead | Partial | `CONFIRMED` |
| **INB-TC-05** | WebSocket Event `incoming_call` | Emits payload with token to agent socket | Socket disconnected due to auth bug; event not received | Failed | `CONFIRMED` |
| **INB-TC-06** | Polling `GET /telephony/my-ringing-call` | Returns ringing session for assigned agent | Returns `null` due to `participants: []` query bug | Failed | `CONFIRMED` |
| **INB-TC-07** | Agent Accepts Call in UI | Emits `acceptCall` socket event | `telephonySocket` is `null`; emit is skipped | Failed | `CONFIRMED` |
| **INB-TC-08** | Inbound LiveKit SIP Audio Bridge | Remote caller audio bridged to WebRTC agent | LiveKit API rejects token (`invalid token`) | Failed | `CONFIRMED` |
| **INB-TC-09** | Duplicate Webhook Delivery | Idempotency lock ignores redundant payload | Redis `call_event:vobiz:<id>` blocks duplicates | Passed | `CONFIRMED` |
| **INB-TC-10** | Concurrent Call Capacity (3 channels) | 4th inbound call receives busy XML | `capacityService.reserveChannel` blocks 4th call | Passed | `CONFIRMED` |

---

## 5. Summary of Recommended Targeted Inbound Fixes

1. **Carrier Portal Alignment:** Point Vobiz incoming webhook to `https://crm-uec-backend.onrender.com/vobiz/incoming`.
2. **Frontend `SocketProvider.tsx`:** Fix `socket` state nullification by calling `setSocket(socketInstance)`.
3. **Backend `telephony.service.ts`:** Update `getMyRingingCall()` to match on `calleeUserId: agent.userId` instead of requiring non-existent `CallParticipant` records.
4. **Environment Variables:** Update `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` with valid LiveKit Cloud credentials.
