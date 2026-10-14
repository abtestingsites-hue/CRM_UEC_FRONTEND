# QA ENVIRONMENT & INFRASTRUCTURE SPECIFICATION

**Project:** Paramantra / ElderCare Enterprise CRM  
**Date:** October 2026  
**Auditor:** Principal QA Architect & Security Lead  

---

## 1. System & Host Runtime Environment

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 Enterprise | Host OS |
| **Node.js Version** | `v24.20.0` | Active Node execution environment |
| **NPM Version** | `11.19.0` | Node Package Manager |
| **Frontend Framework** | Next.js 16.2.6 (App Router) | React 19.2.4, TypeScript 5, Tailwind CSS 4 |
| **Backend Framework** | NestJS 12.1.2 Unified Server | TypeScript 5.6+, Express 4.19.2 adapter |
| **Legacy Mounted App** | Express 4.19.2 | Mounted at `src/main.ts` via `expressInstance.use(legacyModule.app)` |
| **Database ORM** | Prisma Client `5.22.0` | Active client generated against PostgreSQL |
| **Cache & Realtime** | Redis 5.4.1 client | ioredis connection to cloud provider |

---

## 2. Ports and Network Topology

```
+------------------------------------------------------------------------------------+
|                                  LOCAL NETWORK TOPOLOGY                            |
|                                                                                    |
|   Frontend (Next.js):     http://localhost:3000                                    |
|   Unified Backend (Nest): http://localhost:4000                                    |
|   WebSocket Gateway:      ws://localhost:4000/socket.io                            |
|   Mediasoup Worker Ports: UDP 10000 - 10100 (Host LAN)                             |
+------------------------------------------------------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------------------+
|                                 EXTERNAL CLOUD SERVICES                            |
|                                                                                    |
|   Database Pooler:        aws-1-ap-northeast-1.pooler.supabase.com:5432 (Postgres) |
|   Redis Cloud:            redis-12592.crce276.ap-south-1-3.ec2.cloud.redislabs.com |
|   LiveKit Cloud:          wss://pbx-27wznvd6.livekit.cloud (WebRTC PBX)            |
|   LiveKit SIP Host:       4c0ct02u07s.sip.livekit.cloud                            |
|   Vobiz Telephony:        https://api.vobiz.ai/api/v1 (SIP Trunk + Webhooks)       |
|   Supabase Storage:       https://ftrwxsubjepdxssfuzls.storage.supabase.co         |
|   Twilio Sandbox:         API / whatsapp:+14155238886                              |
|   Gmail IMAP/SMTP:        imap.gmail.com:993 / smtp.gmail.com:587                  |
|   Google GenAI (Gemini):  https://generativelanguage.googleapis.com (SDK)          |
+------------------------------------------------------------------------------------+
```

---

## 3. Discovered Configuration & Operational Blockers

1. **Schema Drift between Repositories:**
   - `CRM/Backend`: Matches PostgreSQL database schema (no `organizationId` in `User`).
   - `CRM/Backend-call service`: Obsolete schema referencing non-existent `organizationId` column. Fails immediately on database query with Prisma code `P2022`. Verified that `CRM/Backend` is the active production codebase.
2. **Redis Cloud Timeout:**
   - The configured cloud Redis instance (`redislabs.com:12592`) experiences connection timeouts (`ETIMEDOUT`), introducing 2,000ms latency pauses on presence lookups and queuing operations.
3. **Gmail IMAP Authentication Failure:**
   - The credentials configured in `EMAIL_USER` / `EMAIL_PASS` fail authentication (`3 NO [AUTHENTICATIONFAILED] Invalid credentials`). IMAP email listener continuously logs authentication failures.
4. **Invalid Google Gemini API Key Format:**
   - The API key format in `.env` (`AQ.Ab8RN6Lm...`) is rejected by the Google GenAI SDK.
5. **Vobiz Inbound Webhook URL:**
   - Uses an ephemeral Ngrok URL (`joyride-darkening-fifteen.ngrok-free.dev`) which disconnects when the local Ngrok process closes.
