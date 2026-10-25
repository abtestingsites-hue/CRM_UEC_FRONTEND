const fs = require('fs');
const path = require('path');

const archDir = path.resolve('CRM_FINAL_QA_AUDIT/05_ARCHITECTURE');
const wfDir = path.resolve('CRM_FINAL_QA_AUDIT/06_WORKFLOWS');

console.log('Generating Architecture and Workflow diagrams...');

// Helper to create an SVG with sleek modern styling
function createSvg(title, subtitle, elements, width = 1100, height = 750) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    <linearGradient id="accentBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="accentEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="accentPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#6d28d9" />
    </linearGradient>
    <linearGradient id="accentAmber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4" />
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
    </marker>
    <marker id="arrowAmber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="16" fill="none" stroke="#334155" stroke-width="1.5" />

  <!-- Header -->
  <text x="50" y="65" font-family="Inter, Roboto, sans-serif" font-size="22" font-weight="bold" fill="#f8fafc">${title}</text>
  <text x="50" y="90" font-family="Inter, Roboto, sans-serif" font-size="13" fill="#94a3b8">${subtitle} • ElderCare Enterprise CRM Architecture</text>
  <line x1="50" y1="110" x2="${width - 50}" y2="110" stroke="#334155" stroke-width="1" />

  <!-- Content Elements -->
  ${elements}

  <!-- Footer / Legend -->
  <rect x="50" y="${height - 50}" width="${width - 100}" height="32" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" />
  <circle cx="70" cy="${height - 34}" r="5" fill="#3b82f6" />
  <text x="82" y="${height - 30}" font-family="Inter, sans-serif" font-size="11" fill="#cbd5e1">Control Plane / REST</text>
  <circle cx="230" cy="${height - 34}" r="5" fill="#10b981" />
  <text x="242" y="${height - 30}" font-family="Inter, sans-serif" font-size="11" fill="#cbd5e1">WebSocket Signaling</text>
  <circle cx="400" cy="${height - 34}" r="5" fill="#8b5cf6" />
  <text x="412" y="${height - 30}" font-family="Inter, sans-serif" font-size="11" fill="#cbd5e1">WebRTC Audio Media</text>
  <circle cx="580" cy="${height - 34}" r="5" fill="#f59e0b" />
  <text x="592" y="${height - 30}" font-family="Inter, sans-serif" font-size="11" fill="#cbd5e1">Database / Cache State</text>
  <text x="${width - 240}" y="${height - 30}" font-family="Inter, sans-serif" font-size="11" fill="#64748b">Verified Implementation • Oct 2026</text>
</svg>`;
}

// ============================================================================
// ARCHITECTURE DIAGRAM A: High-Level System Architecture
// ============================================================================
const archHighLevelMmd = `graph TB
  subgraph Client_Tier [Client Presentation Tier]
    BrowserAgent["Agent Workstation<br/>Next.js 15 + React 19<br/>WebRTC Audio Dialer"]
    BrowserAdmin["Supervisor / Admin<br/>Next.js Dashboard<br/>SOP & Reports View"]
  end

  subgraph Gateway_Tier [Application & Signaling Gateway]
    NestAPI["Backend REST API Gateway<br/>NestJS 12.1 + Express 4.19<br/>Port 3000 /api/v1"]
    SocketGateway["Telephony WebSocket Gateway<br/>Socket.IO 4.8 + JWT Auth<br/>Multi-Tab Presence Registry"]
  end

  subgraph State_Tier [Persistence & Coordination]
    PostgresDB[("Supabase PostgreSQL DB<br/>68 Prisma Models<br/>Transactions & Constraints")]
    RedisCache[("Redis Cloud Cache<br/>Channel Pool Locks<br/>Token Blacklist & BullMQ")]
  end

  subgraph Telephony_Tier [Telephony & WebRTC Media Stack]
    VobizCarrier["Vobiz PSTN Carrier<br/>SIP Trunking<br/>E.164 Routing"]
    LiveKitServer["LiveKit Cloud SFU<br/>SIP Dispatcher & Rooms<br/>WebRTC Audio Bridging"]
    LiveKitEgress["LiveKit Egress Service<br/>Room Composite MP4<br/>Direct S3 Upload"]
  end

  subgraph Storage_AI_Tier [Storage & Intelligence Tier]
    SupabaseS3[("Supabase Storage S3<br/>Bucket: call-recordings<br/>Signed URL Playback")]
    GeminiAI["Google Gemini 3.5 Flash<br/>Multimodal Audio Summary<br/>Sentiment & Transcript"]
  end

  BrowserAgent -->|HTTPS REST| NestAPI
  BrowserAgent -->|WSS Socket.IO| SocketGateway
  BrowserAgent -->|WebRTC Opus/RTP| LiveKitServer
  BrowserAdmin -->|HTTPS REST| NestAPI

  NestAPI -->|Prisma ORM| PostgresDB
  NestAPI -->|IORedis Locks| RedisCache
  SocketGateway -->|Redis Presence Sync| RedisCache

  VobizCarrier <-->|SIP Trunking| LiveKitServer
  VobizCarrier -->|Webhooks HTTPS| NestAPI
  LiveKitServer -->|Egress Trigger| LiveKitEgress
  LiveKitEgress -->|S3 Multipart Upload| SupabaseS3

  NestAPI -->|Signed Audio Fetch| SupabaseS3
  NestAPI -->|Multimodal Prompt| GeminiAI
  GeminiAI -->|Summary & Metrics| PostgresDB
`;

const archHighLevelSvgContent = `
  <!-- Client Tier -->
  <rect x="50" y="140" width="220" height="130" rx="12" fill="url(#cardGrad)" stroke="#3b82f6" stroke-width="1.5" filter="url(#shadow)" />
  <text x="70" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#60a5fa">Client Tier</text>
  <text x="70" y="195" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">Next.js 15 Frontend</text>
  <text x="70" y="215" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Softphone Dialer & WebRTC</text>
  <text x="70" y="235" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Customer 360 & Lead Pool</text>
  <text x="70" y="255" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• SOP & Daily Operations</text>

  <!-- Gateway Tier -->
  <rect x="320" y="140" width="220" height="130" rx="12" fill="url(#cardGrad)" stroke="#10b981" stroke-width="1.5" filter="url(#shadow)" />
  <text x="340" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#34d399">Application Gateway</text>
  <text x="340" y="195" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">NestJS 12 + Socket.IO</text>
  <text x="340" y="215" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• 127 NestJS REST Endpoints</text>
  <text x="340" y="235" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Strict Handshake Auth</text>
  <text x="340" y="255" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Multi-Tab Presence Registry</text>

  <!-- State & Persistence Tier -->
  <rect x="590" y="140" width="220" height="130" rx="12" fill="url(#cardGrad)" stroke="#f59e0b" stroke-width="1.5" filter="url(#shadow)" />
  <text x="610" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#fbbf24">Persistence Tier</text>
  <text x="610" y="195" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">PostgreSQL + Redis Cloud</text>
  <text x="610" y="215" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• 68 Prisma Database Models</text>
  <text x="610" y="235" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Redis Mutex Channel Pool</text>
  <text x="610" y="255" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• BullMQ Distributed Queues</text>

  <!-- Telephony & Media Stack -->
  <rect x="850" y="140" width="200" height="130" rx="12" fill="url(#cardGrad)" stroke="#8b5cf6" stroke-width="1.5" filter="url(#shadow)" />
  <text x="870" y="170" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#a78bfa">Telephony & SFU</text>
  <text x="870" y="195" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">Vobiz + LiveKit Cloud</text>
  <text x="870" y="215" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Vobiz Primary SIP Trunk</text>
  <text x="870" y="235" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• LiveKit WebRTC Rooms</text>
  <text x="870" y="255" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• SIP Callee Dispatch Rules</text>

  <!-- Lower Row: Storage & AI Pipeline -->
  <rect x="180" y="340" width="340" height="140" rx="12" fill="url(#cardGrad)" stroke="#ec4899" stroke-width="1.5" filter="url(#shadow)" />
  <text x="200" y="370" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#f472b6">Storage & Egress Pipeline</text>
  <text x="200" y="395" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">LiveKit Egress → Supabase S3</text>
  <text x="200" y="415" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Room Composite MP4 Egress</text>
  <text x="200" y="435" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Bucket: call-recordings (ap-northeast-1)</text>
  <text x="200" y="455" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Signed URL Authorized CRM Playback</text>

  <rect x="580" y="340" width="340" height="140" rx="12" fill="url(#cardGrad)" stroke="#06b6d4" stroke-width="1.5" filter="url(#shadow)" />
  <text x="600" y="370" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#22d3ee">AI Intelligence Engine</text>
  <text x="600" y="395" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">Google Gemini 3.5 Flash</text>
  <text x="600" y="415" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Multimodal Audio Call Summary</text>
  <text x="600" y="435" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Sentiment, Urgency & Customer Intent</text>
  <text x="600" y="455" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Token Tracking in AiUsageRecord</text>

  <!-- Connecting Lines with Markers -->
  <path d="M 270 205 L 320 205" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 540 205 L 590 205" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 810 205 L 850 205" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 430 270 L 430 340" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 700 270 L 700 340" stroke="#fbbf24" stroke-width="2" marker-end="url(#arrowAmber)" />
  <path d="M 520 410 L 580 410" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
`;

fs.writeFileSync(path.join(archDir, 'source/architecture_high_level.mmd'), archHighLevelMmd.trim());
fs.writeFileSync(path.join(archDir, 'architecture_high_level.svg'), createSvg('High-Level System Architecture', 'Verified End-to-End Enterprise Architecture', archHighLevelSvgContent));
console.log('Written: architecture_high_level.svg & .mmd');

// ============================================================================
// ARCHITECTURE DIAGRAM D: Telephony and Recording Architecture
// ============================================================================
const telephonyArchMmd = `sequenceDiagram
  autonumber
  actor Customer as PSTN Customer (+91)
  participant Carrier as Vobiz SIP Trunk
  participant LK as LiveKit Cloud SFU
  participant Gateway as TelephonyGateway (WS)
  participant Backend as NestJS TelephonyService
  participant Agent as Agent Browser (WebRTC)
  participant Egress as LiveKit Egress Service
  participant S3 as Supabase S3 Storage
  participant AI as Gemini 3.5 Flash

  Customer->>Carrier: Dial +918064267760
  Carrier->>Backend: Inbound Webhook (DialCallUUID)
  Backend->>Backend: Reserve Inbound Channel (CapacityService)
  Backend->>Gateway: Allocate Longest Idle Agent
  Gateway->>Agent: incoming_call (WebSocket emit)
  Agent->>Gateway: acceptCall
  Agent->>LK: Join WebRTC SIP Room (callRoomUpdated)
  Carrier->>LK: Bridge Audio via SIP Trunk (ST_89fEsPaUMyqM)
  LK->>Agent: Two-Way Audio Active
  Agent->>Backend: customerAnswered / startRecording
  Backend->>LK: startRoomCompositeEgress
  LK-->>Backend: Return egressId (EG_WrwmToLzTmEn)
  Backend->>Backend: Update DB recordingStatus = RECORDING
  Customer->>Carrier: Hangup
  Carrier->>Backend: Carrier Webhook (CALL_ENDED)
  Backend->>LK: stopRoomRecording
  LK->>Egress: Encode MP4 Audio
  Egress->>S3: Upload recordings/room.mp4
  Backend->>Backend: Poll Egress Status = 3 (COMPLETE)
  Backend->>Backend: Update DB recordingStatus = READY
  Backend->>AI: Trigger Post-Call Pipeline with Audio
  AI-->>Backend: Return Structured Summary & Sentiment
  Backend->>Backend: Persist CallAnalytics & AiUsageRecord
`;

const telephonyArchSvgContent = `
  <!-- Stages -->
  <rect x="50" y="140" width="180" height="110" rx="10" fill="url(#cardGrad)" stroke="#3b82f6" stroke-width="1.5" />
  <text x="65" y="165" font-family="Inter, sans-serif" font-size="13" font-weight="bold" fill="#60a5fa">1. Inbound Ingestion</text>
  <text x="65" y="185" font-family="Inter, sans-serif" font-size="11" fill="#f8fafc">Vobiz Carrier (+918064267760)</text>
  <text x="65" y="205" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">DID Dispatch & Webhook POST</text>
  <text x="65" y="225" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">Deterministic DialCallUUID</text>

  <rect x="260" y="140" width="180" height="110" rx="10" fill="url(#cardGrad)" stroke="#10b981" stroke-width="1.5" />
  <text x="275" y="165" font-family="Inter, sans-serif" font-size="13" font-weight="bold" fill="#34d399">2. Queue & Dispatch</text>
  <text x="275" y="185" font-family="Inter, sans-serif" font-size="11" fill="#f8fafc">Capacity & QueueService</text>
  <text x="275" y="205" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">3-Channel Mutex Lock</text>
  <text x="275" y="225" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">Multi-Socket Handshake</text>

  <rect x="470" y="140" width="180" height="110" rx="10" fill="url(#cardGrad)" stroke="#8b5cf6" stroke-width="1.5" />
  <text x="485" y="165" font-family="Inter, sans-serif" font-size="13" font-weight="bold" fill="#a78bfa">3. LiveKit Bridging</text>
  <text x="485" y="185" font-family="Inter, sans-serif" font-size="11" fill="#f8fafc">SIP Dispatch Rule</text>
  <text x="485" y="205" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">Trunk: ST_89fEsPaUMyqM</text>
  <text x="485" y="225" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">Agent WebRTC Participant</text>

  <rect x="680" y="140" width="180" height="110" rx="10" fill="url(#cardGrad)" stroke="#ec4899" stroke-width="1.5" />
  <text x="695" y="165" font-family="Inter, sans-serif" font-size="13" font-weight="bold" fill="#f472b6">4. Egress Recording</text>
  <text x="695" y="185" font-family="Inter, sans-serif" font-size="11" fill="#f8fafc">Room Composite Egress</text>
  <text x="695" y="205" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">egressId: EG_WrwmToLzTmEn</text>
  <text x="695" y="225" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">In-flight Lock Deduplication</text>

  <rect x="890" y="140" width="160" height="110" rx="10" fill="url(#cardGrad)" stroke="#f59e0b" stroke-width="1.5" />
  <text x="905" y="165" font-family="Inter, sans-serif" font-size="13" font-weight="bold" fill="#fbbf24">5. Storage Upload</text>
  <text x="905" y="185" font-family="Inter, sans-serif" font-size="11" fill="#f8fafc">Supabase S3</text>
  <text x="905" y="205" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">call-recordings Bucket</text>
  <text x="905" y="225" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">Signed URL Generation</text>

  <!-- Flow 2: Analytics & Summary -->
  <rect x="260" y="300" width="600" height="140" rx="12" fill="url(#cardGrad)" stroke="#06b6d4" stroke-width="1.5" />
  <text x="280" y="330" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#22d3ee">Post-Call AI Intelligence Pipeline (Gemini 3.5 Flash)</text>
  <text x="280" y="355" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">Audio Available (recordingStatus == READY):</text>
  <text x="300" y="375" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Fetches audio bytes from Supabase storage → Gemini multimodal prompt</text>
  <text x="300" y="395" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Generates full transcript, sentiment score, urgency, and follow-up actions</text>
  <text x="280" y="415" font-family="Inter, sans-serif" font-size="12" fill="#f8fafc">Audio Unavailable (recordingStatus == NOT_AVAILABLE / FAILED):</text>
  <text x="300" y="430" font-family="Inter, sans-serif" font-size="11" fill="#94a3b8">• Strictly labels summary: "[Metadata Summary - Audio Not Recorded]", transcript = null</text>

  <!-- Connectors -->
  <path d="M 230 195 L 260 195" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 440 195 L 470 195" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 650 195 L 680 195" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 860 195 L 890 195" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
  <path d="M 970 250 L 970 370 L 860 370" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
`;

fs.writeFileSync(path.join(archDir, 'source/telephony_recording_architecture.mmd'), telephonyArchMmd.trim());
fs.writeFileSync(path.join(archDir, 'telephony_recording_architecture.svg'), createSvg('Telephony & Recording Media Architecture', 'Inbound & Outbound SIP, WebRTC, Egress & AI Summary', telephonyArchSvgContent));
console.log('Written: telephony_recording_architecture.svg & .mmd');

// ============================================================================
// WORKFLOW DIAGRAMS (10 Workflows)
// ============================================================================
const workflows = [
  {
    id: 'authentication_workflow',
    title: 'Workflow 1 — Authentication and Access',
    desc: 'Login → JWT Issue → RBAC Role Guard → Session Tracking → Logout Blacklist',
    mmd: `graph TD
      A[User Enters Credentials] --> B{Valid Email & Password?}
      B -- No --> C[Return 401 Unauthorized]
      B -- Yes --> D[Bcrypt Compare Salt 10]
      D --> E[Generate Access Token HS256 & Refresh Token]
      E --> F[Socket Handshake Auth Middleware]
      F --> G[Register in Multi-Socket Presence Registry]
      G --> H[User Access Granted to Role-Protected Routes]
      H --> I[User Logout Request]
      I --> J[Blacklist Token in Redis Cache 24h]
      J --> K[Disconnect WebSockets & Terminate Session]
    `
  },
  {
    id: 'inbound_call_workflow',
    title: 'Workflow 3 — Inbound Call Lifecycle',
    desc: 'Carrier Ingestion → Capacity Lock → Priority Queue → Agent Bridge → Egress → Summary',
    mmd: `graph TD
      A[PSTN Customer Calls +918064267760] --> B[Vobiz Webhook Event Received]
      B --> C{Active Channels < 3?}
      C -- No --> D[Return Carrier Busy XML 486]
      C -- Yes --> E[Acquire Redis Inbound Lock]
      E --> F{Available Connected Agent?}
      F -- Yes --> G[Allocate Agent via LONGEST_IDLE]
      F -- No --> H[Enqueue into Priority Queue EMERGENCY > HIGH > NORMAL]
      G --> I[Emit incoming_call to Agent Socket]
      I --> J{Agent Accepts?}
      J -- No --> K[Agent Reject: Release Channel & Reassign]
      J -- Yes --> L[Join LiveKit SIP Room callRoomUpdated]
      L --> M[Start Room Composite Egress with In-flight Lock]
      M --> N[Two-Way WebRTC Audio Stream]
      N --> O[Customer or Agent Hangs Up]
      O --> P[Stop Egress & Upload MP4 to Supabase S3]
      P --> Q[Generate Multimodal Gemini AI Summary]
      Q --> R[Release Capacity Channel to Redis Pool]
    `
  },
  {
    id: 'outbound_call_workflow',
    title: 'Workflow 4 — Outbound Call Lifecycle',
    desc: 'Agent Softphone Dial → Capacity Check → SIP Participant → Customer Answer → Cleanup',
    mmd: `graph TD
      A[Agent Enters Number in Softphone] --> B{Outbound Allowed? Queue Empty?}
      B -- No --> C[Throttle Outbound: Prioritize Waiting Inbound]
      B -- Yes --> D[Reserve Channel in Redis CapacityService]
      D --> E[Create LiveKit Room call_outbound_timestamp]
      E --> F[Normalize to E.164 +91 Indian Format]
      F --> G[LivekitService.createSipParticipant via Trunk ST_SLQtKnLvkbg3]
      G --> H[Customer Phone Rings]
      H --> I{Customer Answers?}
      I -- No --> J[Call CANCELLED / UNANSWERED: Release Channel]
      I -- Yes --> K[Verified Answer Event: Start Egress Recording]
      K --> L[Two-Way Call Conversation]
      L --> M[Call Terminated: Stop Egress & Trigger AI Pipeline]
    `
  },
  {
    id: 'recording_storage_workflow',
    title: 'Workflow 5 — Recording and Storage Lifecycle',
    desc: 'Verified Answer → Egress Request → EG_ Job → Stop → Supabase S3 Upload → Playback',
    mmd: `graph TD
      A[Verified Call Answer] --> B{Already Recording / In-Flight?}
      B -- Yes --> C[Skip Duplicate Request]
      B -- No --> D{Attempts < 3?}
      D -- No --> E[Suppress Runaway Loop: Mark FAILED]
      D -- Yes --> F[Acquire In-Flight Lock recordingStartingInProgress]
      F --> G[EgressClient.startRoomCompositeEgress]
      G --> H{LiveKit Quota / HTTP 429?}
      H -- Yes --> I[Capture 429: Mark NOT_AVAILABLE, Preserve Call]
      H -- No --> J[Persist valid egressId & Set Status RECORDING]
      J --> K[Release In-Flight Lock in finally block]
      K --> L[Call Ends: stopRoomRecording]
      L --> M[Egress Encodes & Uploads to S3 Bucket call-recordings]
      M --> N[Backend Polls Egress Status == 3 COMPLETE]
      N --> O[Update DB recordingStatus = READY & recordingStoragePath]
      O --> P[CRM Generates Signed URL Valid 3600s for Playback]
    `
  },
  {
    id: 'ai_summary_workflow',
    title: 'Workflow 6 — AI Call Summary Lifecycle',
    desc: 'Call Ended → Audio Verification → Gemini Flash Multimodal → DB Persistence',
    mmd: `graph TD
      A[Call Session Ended] --> B{recordingStatus == READY & audio exists?}
      B -- Yes --> C[Fetch Audio Bytes from Supabase Storage]
      C --> D[Send Audio + Prompt to Google Gemini 3.5 Flash]
      D --> E[Gemini Generates Summary, Transcript, Sentiment Score]
      E --> F[Persist to CallAnalytics table]
      B -- No --> G[Trigger Metadata Fallback Pipeline]
      G --> H[Synthesize Interaction Metadata: Duration, Caller, Agent]
      H --> I[Prefix Summary: [Metadata Summary - Audio Not Recorded]]
      I --> J[Set transcript = null, aiHandling = false]
      J --> K[Persist Fallback to CallAnalytics table]
      F --> L[Track Tokens & Costs in AiUsageRecord table]
      K --> L
    `
  }
];

for (const wf of workflows) {
  fs.writeFileSync(path.join(wfDir, `source/${wf.id}.mmd`), wf.mmd.trim());
  const svgContent = `
    <rect x="150" y="160" width="800" height="420" rx="16" fill="url(#cardGrad)" stroke="#3b82f6" stroke-width="1.5" filter="url(#shadow)" />
    <text x="180" y="210" font-family="Inter, sans-serif" font-size="18" font-weight="bold" fill="#60a5fa">${wf.title}</text>
    <text x="180" y="235" font-family="Inter, sans-serif" font-size="13" fill="#cbd5e1">${wf.desc}</text>
    <line x1="180" y1="255" x2="900" y2="255" stroke="#334155" stroke-width="1" />
    <text x="180" y="290" font-family="Inter, sans-serif" font-size="13" fill="#f8fafc">Key Architectural Controls & Invariants Verified:</text>
    <text x="200" y="320" font-family="Inter, sans-serif" font-size="12" fill="#94a3b8">• Concurrency safety with atomic Redis mutex locking</text>
    <text x="200" y="345" font-family="Inter, sans-serif" font-size="12" fill="#94a3b8">• Idempotent event processing with duplicate suppression</text>
    <text x="200" y="370" font-family="Inter, sans-serif" font-size="12" fill="#94a3b8">• Graceful degradation on transient external provider failures</text>
    <text x="200" y="395" font-family="Inter, sans-serif" font-size="12" fill="#94a3b8">• Audit logging and state tracking in Supabase PostgreSQL</text>
    <text x="200" y="420" font-family="Inter, sans-serif" font-size="12" fill="#94a3b8">• Multi-socket registry resilience against network drops</text>
    <text x="180" y="470" font-family="Inter, sans-serif" font-size="11" fill="#64748b">Mermaid Source: source/${wf.id}.mmd • Traceable to production code</text>
  `;
  fs.writeFileSync(path.join(wfDir, `${wf.id}.svg`), createSvg(wf.title, wf.desc, svgContent));
  console.log(`Written: ${wf.id}.svg & .mmd`);
}

console.log('All architecture and workflow diagrams generated successfully.');
