# ElderCare Enterprise CRM — Business Workflows & Execution Pathways

## 1. Executive Summary of Workflows
This document details the 10 core business workflows implemented in the ElderCare Enterprise CRM, mapping user interactions, carrier events, backend services, and database state transitions.

---

## 2. Implemented Workflows

### Workflow 1: Authentication and Access
![Workflow 1](authentication_workflow.svg)
- **Path:** Agent Login → Bcrypt Password Verification (salt 10) → HS256 JWT Token Issue → Socket Handshake Auth → Multi-Tab Presence Registry → Role Guard Evaluation → Logout with Redis Token Blacklist.

### Workflow 3: Inbound Call Lifecycle
![Workflow 3](inbound_call_workflow.svg)
- **Path:** PSTN Call on +918064267760 → Vobiz Carrier Webhook → Capacity Check (3 channels max) → Queue Enqueue (`EMERGENCY` > `HIGH` > `NORMAL`) → Agent Socket Dispatch (`incoming_call`) → Agent Accept → LiveKit SIP Bridging (`callRoomUpdated`) → Two-Way Audio → Egress Start → Call End → MP4 S3 Upload → Gemini AI Summary → Capacity Release.

### Workflow 4: Outbound Call Lifecycle
![Workflow 4](outbound_call_workflow.svg)
- **Path:** Agent Enters Number in Softphone → Capacity Reservation Check → Outbound LiveKit Room Created (`call_outbound_...`) → E.164 Normalization (`+91...`) → Vobiz Outbound SIP Trunk (`ST_SLQtKnLvkbg3`) → Customer Phone Rings → Verified Answer → Egress Recording Triggered → Call Ends → AI Summary & Teardown.

### Workflow 5: Recording and Storage Lifecycle
![Workflow 5](recording_storage_workflow.svg)
- **Path:** Verified Call Answer → In-Flight Concurrency Lock Acquired → LiveKit Egress Started (`EG_WrwmToLzTmEn`) → In-Flight Lock Released → Active Call Conversation → Call Ends → Egress Stopped → S3 Upload (`call-recordings`) → Egress Status COMPLETE → Database Updated to `READY` → Signed URL Generated (3600s TTL).

### Workflow 6: AI Call Summary Lifecycle
![Workflow 6](ai_summary_workflow.svg)
- **Path:** Call Terminated → Check Recording Status → If `READY`: Fetch Audio Bytes → Google Gemini 3.5 Flash Multimodal → Generate Transcript, Sentiment, Intent → Persist to `CallAnalytics` → Track Cost in `AiUsageRecord`. If `NOT_AVAILABLE`: Synthesize Metadata Summary labeled `[Metadata Summary - Audio Not Recorded]`, `transcript = null`.