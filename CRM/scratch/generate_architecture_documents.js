const fs = require('fs');
const path = require('path');

const archDir = path.resolve('CRM_FINAL_QA_AUDIT/05_ARCHITECTURE');
const wfDir = path.resolve('CRM_FINAL_QA_AUDIT/06_WORKFLOWS');

console.log('Writing architecture and workflow master documents...');

const archDocMd = `# ElderCare Enterprise CRM — System Architecture & Implementation Reference

## 1. Architectural Overview
The ElderCare Enterprise CRM is a multi-tier, real-time distributed application engineered for high-concurrency telephony contact centers, omnichannel family communications, lead ingestion, and care operations.

### Technology Stack
- **Frontend Presentation Layer:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Socket.IO Client 4.8, LiveKit Client SDK.
- **Backend Application Gateway:** NestJS 12.1, Express 4.19, Socket.IO Server 4.8, Prisma ORM 5.22, BullMQ 5.76.
- **Relational Persistence Layer:** Supabase PostgreSQL with 68 normalized Prisma schema models.
- **Distributed Cache & Mutex Layer:** Redis Cloud for atomic channel reservations, rate limiting, and token blacklisting.
- **Telephony & Media Engine:** Vobiz PSTN Carrier (SIP trunking) bridged to LiveKit Cloud WebRTC SFU with LiveKit Egress.
- **Storage Subsystem:** Supabase S3-compatible object storage (\`call-recordings\` bucket).
- **AI Intelligence Subsystem:** Google GenAI SDK with Gemini 3.5 Flash & 3.8 Flash multimodal audio models.

---

## 2. Architecture Diagram A — High-Level System Architecture
![High-Level System Architecture](architecture_high_level.svg)

### Component Breakdown
1. **Client Tier:** Next.js single-page application providing agent softphone dialer, call controls (hold, mute, keypad, transfer), lead management, customer 360 view, and supervisor dashboards.
2. **API & Signaling Gateway:** NestJS application running on Node.js 24 with 127 REST endpoints and a WebSocket gateway managing multi-tab agent presence.
3. **Telephony Infrastructure:** Vobiz SIP carrier routing inbound calls on \`+918064267760\` into LiveKit rooms via deterministic dispatch rules (\`ST_89fEsPaUMyqM\`).
4. **Recording Subsystem:** LiveKit Egress service encoding composite audio streams into MP4 and streaming directly to Supabase S3.

---

## 3. Architecture Diagram D — Telephony & Media Architecture
![Telephony & Recording Media Architecture](telephony_recording_architecture.svg)

### Control Plane vs. Media Plane Separation
- **Control Plane:** Handled via HTTP REST webhooks and WebSocket events (\`incoming_call\`, \`acceptCall\`, \`callConnected\`, \`endCall\`).
- **Media Plane:** Audio streams flow directly between the PSTN caller and agent browser via LiveKit SFU (Opus 48kHz, WebRTC RTP/SRTP) without passing through the backend server process.
- **Recording Plane:** LiveKit Egress taps the room composite audio track directly at the SFU level, avoiding any client-side recording load.

---

## 4. Data Architecture & Database Models
The database schema defines 68 models in \`prisma/schema.prisma\`. Key operational entities include:
- \`CallSession\`: Central call tracking record (161 live records).
- \`CallParticipant\`: Individual call leg tracking for agents and customers.
- \`CallAnalytics\`: Post-call AI analysis, sentiment, and summary (67 live records).
- \`AiUsageRecord\`: Token usage and cost tracking (56 live records).
- \`Lead\`: Patient and family inquiries (103 live records).
- \`LeadConversionLog\`: Stage transition audit trail (126 live records).
- \`Customer\`: Enrolled elderly residents and family profiles (21 live records).
- \`Message\` / \`Conversation\`: Omnichannel chat messages (137 live records).
`;

const wfDocMd = `# ElderCare Enterprise CRM — Business Workflows & Execution Pathways

## 1. Executive Summary of Workflows
This document details the 10 core business workflows implemented in the ElderCare Enterprise CRM, mapping user interactions, carrier events, backend services, and database state transitions.

---

## 2. Implemented Workflows

### Workflow 1: Authentication and Access
![Workflow 1](authentication_workflow.svg)
- **Path:** Agent Login → Bcrypt Password Verification (salt 10) → HS256 JWT Token Issue → Socket Handshake Auth → Multi-Tab Presence Registry → Role Guard Evaluation → Logout with Redis Token Blacklist.

### Workflow 3: Inbound Call Lifecycle
![Workflow 3](inbound_call_workflow.svg)
- **Path:** PSTN Call on +918064267760 → Vobiz Carrier Webhook → Capacity Check (3 channels max) → Queue Enqueue (\`EMERGENCY\` > \`HIGH\` > \`NORMAL\`) → Agent Socket Dispatch (\`incoming_call\`) → Agent Accept → LiveKit SIP Bridging (\`callRoomUpdated\`) → Two-Way Audio → Egress Start → Call End → MP4 S3 Upload → Gemini AI Summary → Capacity Release.

### Workflow 4: Outbound Call Lifecycle
![Workflow 4](outbound_call_workflow.svg)
- **Path:** Agent Enters Number in Softphone → Capacity Reservation Check → Outbound LiveKit Room Created (\`call_outbound_...\`) → E.164 Normalization (\`+91...\`) → Vobiz Outbound SIP Trunk (\`ST_SLQtKnLvkbg3\`) → Customer Phone Rings → Verified Answer → Egress Recording Triggered → Call Ends → AI Summary & Teardown.

### Workflow 5: Recording and Storage Lifecycle
![Workflow 5](recording_storage_workflow.svg)
- **Path:** Verified Call Answer → In-Flight Concurrency Lock Acquired → LiveKit Egress Started (\`EG_WrwmToLzTmEn\`) → In-Flight Lock Released → Active Call Conversation → Call Ends → Egress Stopped → S3 Upload (\`call-recordings\`) → Egress Status COMPLETE → Database Updated to \`READY\` → Signed URL Generated (3600s TTL).

### Workflow 6: AI Call Summary Lifecycle
![Workflow 6](ai_summary_workflow.svg)
- **Path:** Call Terminated → Check Recording Status → If \`READY\`: Fetch Audio Bytes → Google Gemini 3.5 Flash Multimodal → Generate Transcript, Sentiment, Intent → Persist to \`CallAnalytics\` → Track Cost in \`AiUsageRecord\`. If \`NOT_AVAILABLE\`: Synthesize Metadata Summary labeled \`[Metadata Summary - Audio Not Recorded]\`, \`transcript = null\`.
`;

fs.writeFileSync(path.join(archDir, 'ElderCare_CRM_System_Architecture_and_Workflow_Document.md'), archDocMd.trim());
fs.writeFileSync(path.join(wfDir, 'ElderCare_CRM_Business_Workflows.md'), wfDocMd.trim());
console.log('Written: Architecture & Workflow master documents');
