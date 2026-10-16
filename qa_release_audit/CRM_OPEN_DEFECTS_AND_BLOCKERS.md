# CRM OPEN DEFECTS AND EXTERNAL BLOCKERS AUDIT

**Repository**: `d:/Testing/Crm_summary working/CRM`  
**Branch**: `remediation/master-crm-telephony-omnichannel`  
**Audit Date**: October 16, 2026  
**Status**: **Zero Open Code Defects; External Carrier Verification Required for Live Go-Live**

---

## 1. Defect Closure Summary

All verified internal code defects across Phases 4, 5, and 6 have been investigated, remediated in code, and confirmed passing by automated test suites.

| Defect ID | Domain | Summary | Remediation | Status |
|---|---|---|---|---|
| **DEF-CORE-01** | Leads | Duplicate router definition & 500 crash on duplicate phone | Consolidated `POST /api/v1/leads`, added 409 Conflict with `DUPLICATE_PHONE_NUMBER` | **CLOSED** |
| **DEF-CORE-02** | Leads | Pagination `page`/`skip` ignored in cache | Added `skip` calculation and incorporated into single-flight cache key | **CLOSED** |
| **DEF-CORE-03** | Calendar | `POST /calendar` 404 & silent empty catch block | Implemented `POST /calendar` and `DELETE /calendar/:id` with conflict checks & error alerts | **CLOSED** |
| **DEF-CORE-04** | Analytics | Fabricated trend multipliers in dashboard metrics | Replaced synthetic percentage multipliers with authentic database counts | **CLOSED** |
| **DEF-TEL-01** | Telephony | Vobiz status callback 404 on `/telephony/vobiz/status` | Annotated `VobizController` with `@Controller(['vobiz', 'telephony/vobiz'])` & `@HttpCode(200)` | **CLOSED** |
| **DEF-TEL-02** | Telephony | SIP destination number non-E.164 formatting | Verified E.164 normalization (+91 for 10-digit numbers) in `LivekitService` | **CLOSED** |
| **DEF-TEL-03** | Telephony | Recording authorization and IDOR vulnerability | Verified role-based and agent-isolated access guards on recording endpoints | **CLOSED** |
| **DEF-TEL-04** | AI | AI post-call processing failure on rate limit spikes | Verified error trapping and catalog model `gemini-3.5-flash` compatibility | **CLOSED** |
| **DEF-OMNI-01** | Omnichannel | Simulated voice note calling dead port `3001` & `setTimeout` | Removed mock voice note handler and fake AI suggestion timeout | **CLOSED** |
| **DEF-OMNI-02** | Omnichannel | Mock conversations fallback in `conversationStore.ts` | Removed hardcoded `conv_1`/`conv_2` fallback; surfaces authentic error state | **CLOSED** |
| **DEF-OMNI-03** | Omnichannel | Hardcoded Gmail SMTP application password in `mailer.js` | Removed hardcoded password; enforced environment variable resolution | **CLOSED** |
| **DEF-OMNI-04** | Omnichannel | Unhandled exceptions on unconfigured external channels | Added early checks returning HTTP 503 `PROVIDER_NOT_CONFIGURED` | **CLOSED** |

---

## 2. External Provider & Environmental Blockers

The following items are not code bugs, but external dependencies requiring operator provisioning before live production customer traffic can be enabled:

### BLK-EXT-01: Vobiz Production SIP Trunk Verification
- **Classification**: External Provider Configuration
- **Description**: While webhook routing (`/vobiz/status` and `/telephony/vobiz/status`) and LiveKit SIP dispatch logic are fully tested with simulated carrier requests, live end-to-end PSTN bridging requires active Vobiz trunk credentials and carrier SIP peering in production.
- **Action Required**: Telephony team to provision live trunk balance and verify inbound audio routing with a designated test carrier number.

### BLK-EXT-02: Twilio WhatsApp Approved Business Number
- **Classification**: External Provider Approval
- **Description**: The CRM backend correctly validates and formats WhatsApp messages for Twilio, but production delivery requires an active Twilio WhatsApp Business Profile and Meta-approved message templates.
- **Action Required**: Operations team to configure production `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER`.

### BLK-EXT-03: Meta Instagram Graph API Production Token
- **Classification**: External Provider Approval
- **Description**: Outbound Instagram messaging routes through Graph API v21.0. The code safely degrades when unconfigured, but live Instagram DM dispatch requires Meta App Review approval and a valid Page Access Token (`META_ACCESS_TOKEN`).
- **Action Required**: Meta Developer administrator to complete app review and inject production secrets into deployment environment.
