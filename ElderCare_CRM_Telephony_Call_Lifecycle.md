# ELDERCARE CRM — TELEPHONY CALL LIFECYCLE & SIGNALING SPECIFICATION

**Target Systems:**  
- **ERP SuperAdmin Frontend:** `https://erp-uec-superadminapp-zulp.onrender.com/crm?tab=telephony`  
- **CRM Backend API:** `https://crm-uec-backend.onrender.com`  
- **Carrier Infrastructure:** Vobiz Carrier Network (Inbound DID: `+918064267760`)  
- **Media & SIP Infrastructure:** LiveKit Cloud (`crm-8q9fuunw.livekit.cloud`, SIP Host: `3ecoesrfwws.sip.livekit.cloud`)  
- **Scope:** Complete Inbound and Outbound Lifecycle Analysis, First-Failing-Step Identification, and Media Transport Specification  

---

## 1. 10-Step End-to-End Call Lifecycle Comparison

The following table correlates a single controlled test call across the Frontend, Backend, Vobiz Carrier, and LiveKit Cloud.

| Step | Lifecycle Stage | Expected Behavior (Ideal) | Inbound Observed State | Outbound Observed State | First Failure Point? |
|---|---|---|---|---|---|
| **1** | **Request Created** | Agent dials number on UI or caller dials DID `+918064267760` | Webhook dispatched to `/vobiz/incoming` | Dial pad dispatches `POST /telephony/calls/outbound` | No |
| **2** | **Backend Request Accepted** | API/Webhook authenticated; payload validated | Webhook validated; HMAC signature checked | Controller accepts request with CRM JWT | No |
| **3** | **Call Session Created** | `CallSession` record persisted in PostgreSQL (`status: 'RINGING'`) | `CallSession` created (`status: 'RINGING'`) | `CallSession` created (`status: 'RINGING'`) | No |
| **4** | **Agent Reserved** | Queue service reserves an eligible online agent | ❌ **FAIL (Inbound):** Agent socket is dead/null; agent deallocated & set to `OFFLINE` | Agent assigned from request or JWT | **YES (Inbound)** |
| **5** | **Provider Call Initiated** | Backend bridges inbound SIP or dials outbound SIP trunk | Vobiz returns `<Dial><Sip>...` bridge XML | Backend calls `livekitService.createSipParticipant` | No |
| **6** | **SIP Participant Joined** | LiveKit SIP server creates participant in room | ❌ **FAIL (Inbound):** Background SIP check fails (`invalid token`) | ❌ **FAIL (Outbound):** LiveKit Cloud rejects RPC (`invalid token`) | **YES (Outbound)** |
| **7** | **Agent Notified** | WebSocket `incoming_call` emitted; modal rendered | Skipped: Agent socket dead; `telephonySocket` is `null` in React | Agent UI in dialing state; no LiveKit token | Subsequent |
| **8** | **Customer Answered** | Carrier signals 200 OK; remote participant active | Never reached | Never reached | Subsequent |
| **9** | **Two-Way Media Established** | WebRTC Opus audio exchanged between browser and PSTN G.711 | Never reached | Never reached | Subsequent |
| **10** | **Teardown & Cleanup** | Hangup event releases capacity, updates session, records duration | Call left in limbo or dropped | Session updated to `FAILED`; capacity released | Subsequent |

---

## 2. Inbound Call Lifecycle: Ideal vs Actual (Mermaid Diagrams)

### 2.1 Ideal Inbound Call Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Caller as PSTN Caller (+91...)
    participant Vobiz as Vobiz Carrier
    participant Webhook as CRM VobizController
    participant Telephony as TelephonyService
    participant Queue as QueueService
    participant DB as PostgreSQL
    participant Gateway as TelephonyGateway
    participant AgentUI as Agent Frontend (ERP)
    participant LiveKit as LiveKit SIP & WebRTC

    Caller->>Vobiz: Dials DID +918064267760
    Vobiz->>Webhook: POST /vobiz/incoming (From, CallUUID)
    Webhook->>Telephony: processNormalizedEvent(CALL_RINGING)
    Telephony->>Queue: allocateAgent(LONGEST_IDLE)
    Queue-->>Telephony: returns activeAgent (socketId)
    Telephony->>DB: createCallSession(status='RINGING', calleeUserId)
    Telephony->>LiveKit: generateAgentToken(roomName, agentName)
    LiveKit-->>Telephony: token, wsUrl
    Telephony->>Gateway: dispatchIncomingCallToAgent(socketId, payload)
    Gateway->>AgentUI: emit('incoming_call', { roomName, token })
    Webhook-->>Vobiz: HTTP 200 XML <Dial><Sip>sip:call_<id>@livekit</Sip></Dial>
    Vobiz->>LiveKit: SIP INVITE to sip:call_<id>@3ecoesrfwws.sip.livekit.cloud
    AgentUI->>AgentUI: IncomingCallModal rings
    AgentUI->>Gateway: emit('acceptCall', { callSid, agentId })
    Gateway->>Telephony: acceptCallSession(callSid, agentId)
    Telephony->>DB: update status='IN_PROGRESS', create CallParticipant
    AgentUI->>LiveKit: Connect WebRTC Room via token
    LiveKit-->>AgentUI: Two-way audio bridged (Opus <-> G.711)
```

### 2.2 Observed Failed Inbound Call Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Caller as PSTN Caller (+91...)
    participant Vobiz as Vobiz Carrier
    participant Webhook as CRM VobizController
    participant Telephony as TelephonyService
    participant Queue as QueueService
    participant DB as PostgreSQL
    participant Gateway as TelephonyGateway
    participant AgentUI as Agent Frontend (ERP)

    Caller->>Vobiz: Dials DID +918064267760
    Note over Vobiz,Webhook: Potential Failure 1: Webhook points to expired ngrok URL
    Vobiz->>Webhook: POST /vobiz/incoming (From, CallUUID)
    Webhook->>Telephony: processNormalizedEvent(CALL_RINGING)
    Telephony->>Queue: allocateAgent(LONGEST_IDLE)
    Queue-->>Telephony: potentialAgent (with socketId)
    Note over Telephony,Gateway: FAILING STEP 1: Gateway socket check fails
    Telephony->>Telephony: directSocket?.connected === false
    Telephony->>Queue: releaseAgentReservation(agent.id)
    Telephony->>DB: UPDATE Agent SET status='OFFLINE', socketId=null
    Telephony->>Queue: enqueueCallItem(waitingPool)
    Telephony->>DB: createCallSession(isEnqueued=true, participants=[])
    Note over Telephony,AgentUI: No incoming_call socket event emitted!
    Webhook-->>Vobiz: HTTP 200 XML (Bridge or Busy Speak)
    Note over AgentUI: Potential Polling Fallback (GET /telephony/my-ringing-call)
    AgentUI->>Telephony: GET /telephony/my-ringing-call
    Telephony->>DB: SELECT CallSession WHERE participants.some(agentId)
    Note over DB,Telephony: FAILING STEP 2: participants array is empty!
    DB-->>Telephony: null
    Telephony-->>AgentUI: HTTP 200 { callSession: null }
    Caller->>Caller: Call hears busy tone or terminates
```

---

## 3. Outbound Call Lifecycle: Ideal vs Actual (Mermaid Diagrams)

### 3.1 Ideal Outbound Call Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Agent as CRM Agent
    participant DialPad as NumericKeypad (Frontend)
    participant Auth as Auth Store
    participant API as TelephonyController
    participant Service as TelephonyService
    participant Capacity as CapacityService
    participant Provider as VobizProvider
    participant LiveKitSip as LivekitService (SipClient)
    participant LKCloud as LiveKit Cloud Server
    participant Carrier as Vobiz SIP Trunk
    actor Customer as Remote Customer

    Agent->>DialPad: Enters phone number & clicks Call
    DialPad->>Auth: Reads crm_user.agentId & token
    DialPad->>API: POST /telephony/calls/outbound { to, agentId }
    API->>Service: initiateOutboundCall(request)
    Service->>Capacity: reserveChannel('OUTBOUND') (1 of 3)
    Capacity-->>Service: reservationToken
    Service->>Service: createCallSession(status='RINGING', direction='outbound')
    Service->>Provider: initiateOutboundCall(request, roomName)
    Provider->>LiveKitSip: createSipParticipant(roomName, trunkId, to)
    LiveKitSip->>LKCloud: Twirp RPC: SipClient.createSipParticipant()
    LKCloud->>Carrier: SIP INVITE to customer number
    LKCloud-->>LiveKitSip: sipParticipantIdentity
    LiveKitSip-->>Service: sipParticipantIdentity
    Service->>LiveKitSip: generateAgentToken(roomName, agentName)
    LiveKitSip-->>Service: agentToken, wsUrl
    Service-->>API: { success: true, roomName, token, wsUrl }
    API-->>DialPad: HTTP 200 OK
    DialPad->>Agent: Transitions UI to DIALING / RINGING
    DialPad->>LKCloud: Agent connects to WebRTC room via agentToken
    Carrier->>Customer: Customer mobile rings
    Customer->>Carrier: Customer answers (200 OK)
    Carrier->>LKCloud: SIP 200 OK (RTP stream started)
    LKCloud->>LiveKitSip: Webhook/Attribute: sip.callStatus = 'active'
    LKCloud-->>Agent: Two-way audio bridged
    DialPad->>Agent: UI transitions to CONNECTED (Timer begins)
```

### 3.2 Observed Failed Outbound Call Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Agent as CRM Agent
    participant DialPad as NumericKeypad (Frontend)
    participant API as TelephonyController
    participant Service as TelephonyService
    participant Capacity as CapacityService
    participant Provider as VobizProvider
    participant LiveKitSip as LivekitService (SipClient)
    participant LKCloud as LiveKit Cloud Server

    Agent->>DialPad: Enters phone number & clicks Call
    DialPad->>API: POST /telephony/calls/outbound { to: "+919876543210", agentId }
    API->>Service: initiateOutboundCall(request)
    Service->>Capacity: reserveChannel('OUTBOUND')
    Capacity-->>Service: reservationToken
    Service->>Service: createCallSession(status='RINGING')
    Service->>Provider: initiateOutboundCall(request, roomName)
    Provider->>LiveKitSip: createSipParticipant(roomName, ST_SLQtKnLvkbg3, to)
    LiveKitSip->>LKCloud: Twirp RPC: createSipParticipant()
    Note over LiveKitSip,LKCloud: ❌ FIRST FAILING STEP: LiveKit Cloud Authentication
    LKCloud-->>LiveKitSip: Error: invalid token (Twirp Unauthenticated)
    LiveKitSip-->>Provider: throws Error("invalid token")
    Provider-->>Service: throws Error("invalid token")
    Service->>Capacity: releaseChannel(reservationToken)
    Service->>Service: UPDATE CallSession SET status='FAILED', endedAt=now()
    Service-->>API: throws Error("invalid token")
    Note over API: Catch block wraps into safe error
    API-->>DialPad: HTTP 500 { safeErrorCode: "LIVEKIT_SIP_ERROR", message: "Failed to initiate outbound call via LiveKit..." }
    DialPad->>Agent: Error banner: "Call initiation failed. Please verify provider connectivity."
    Note over Agent: No PSTN call placed. Agent left on dial pad.
```

---

## 4. Telephony State Machines

### 4.1 CallSession State Transitions

```mermaid
stateDiagram-v2
    [*] --> RINGING: Inbound Webhook / Outbound Request
    RINGING --> IN_PROGRESS: Agent Accepts (Inbound) / Customer Answers (Outbound)
    RINGING --> MISSED: Ring Timeout / No Answer / Canceled
    RINGING --> FAILED: LiveKit SIP Error / Carrier Rejection / Capacity Exhausted
    IN_PROGRESS --> TRANSFERRED: Transfer to Another Agent / Supervisor
    TRANSFERRED --> IN_PROGRESS: Destination Agent Accepts
    IN_PROGRESS --> ENDED: Agent Hangup / Customer Hangup
    FAILED --> [*]
    MISSED --> [*]
    ENDED --> [*]
```

### 4.2 Agent Presence State Transitions

```mermaid
stateDiagram-v2
    [*] --> OFFLINE: Initial / Disconnected
    OFFLINE --> AVAILABLE: Successful WebSocket Handshake + Agent Login
    AVAILABLE --> RESERVED: Inbound Call Allocated (Lock acquired)
    RESERVED --> BUSY: Call Accepted & LiveKit Joined
    RESERVED --> AVAILABLE: Ring Timeout / Call Canceled / Rejected
    RESERVED --> OFFLINE: Socket Disconnected during allocation check
    BUSY --> WRAP_UP: Call Terminated (Form & Notes Active)
    WRAP_UP --> AVAILABLE: Notes Submitted / Wrap-up Timeout
    AVAILABLE --> OFFLINE: Socket Disconnected / Logout
```

### 4.3 Shared Channel Capacity Matrix

The telephony pool maintains a strict capacity limit of **3 shared channels**:

| Direction / Purpose | Reserved Channels | Dynamic Pool | Enforcement Mechanism |
|---|---|---|---|
| **Inbound Active Calls** | 1 (Priority Floor) | 0 to 2 | `capacityService.reserveChannel('INBOUND')` |
| **Outbound Active Calls** | 0 (Preemptible) | 0 to 2 | Paused if inbound queue > 0 or emergency waiting |
| **Warm Transfer Consultation** | 0 | 1 | Occupies 2 channels simultaneously (Parent + Consult) |
| **Emergency Inbound** | Preempts Outbound | Instant | Overrides outbound reservation lock |
| **Total Concurrency Limit** | **3 Channels Maximum** | — | Enforced in Redis with atomic `HINCRBY` / Lua scripts |

---

## 5. Media Transport Architecture

```
  [PSTN Mobile Handset]
          │
          │ G.711 u-law / A-law (RTP / UDP)
          ▼
  [Vobiz Carrier Softswitch]
          │
          │ SIP Trunk INVITE (Digest Auth: e4bac750.sip.vobiz.ai)
          ▼
  [LiveKit Cloud SIP Bridge] (3ecoesrfwws.sip.livekit.cloud)
          │
          │ SIP Trunk Inbound: ST_89fEsPaUMyqM
          │ SIP Trunk Outbound: ST_SLQtKnLvkbg3
          ▼
  [LiveKit Media SFU] (crm-8q9fuunw.livekit.cloud)
          │
          │ Transcoding (G.711 <──> Opus 48 kHz Mono)
          │ Transport: WebRTC (SRTP / DTLS, ICE / STUN / TURN)
          ▼
  [Agent Browser Client] (Chrome / Firefox / Edge)
   LiveKit React SDK (`<LiveKitRoom audio={true}>`)
```

### Protocol & Codec Matrix

| Segment | Protocol | Signaling | Audio Codec | Bitrate | Sample Rate |
|---|---|---|---|---|---|
| **Customer <-> Carrier** | Cellular / PSTN | SS7 / ISUP | AMR-WB / G.711 | 12.2 - 64 kbps | 8 - 16 kHz |
| **Carrier <-> LiveKit SIP** | VoIP SIP Trunk | SIP over UDP/TLS | PCMU / PCMA (G.711) | 64 kbps | 8 kHz |
| **LiveKit SFU <-> Agent** | WebRTC | WebSocket (JSON RPC) | Opus | 24 - 48 kbps | 48 kHz |

---

## 6. Summary of First Failing Events

1. **Inbound First Failing Event:**  
   **Event 4 (Agent Allocation / Socket Liveness):** When the carrier webhook arrives, `telephony.service.ts` evaluates `potentialAgent.socketId`. Because the ERP frontend's `SocketProvider.tsx` suffered a state nullification bug and ERP SSO token exchange was omitted, the agent's socket is disconnected. The backend marks the agent `OFFLINE` and diverts the call to the unassigned queue.
2. **Outbound First Failing Event:**  
   **Event 6 (SIP Participant Joined):** `LivekitService.createSipParticipant()` contacts LiveKit Cloud over Twirp RPC using invalid API credentials. LiveKit Cloud immediately rejects the request with `Error: invalid token`, preventing the Vobiz trunk from being dialed.
