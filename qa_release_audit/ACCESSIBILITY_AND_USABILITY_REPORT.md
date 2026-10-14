# PARAMANTRA / ELDERCARE CRM — ACCESSIBILITY (WCAG 2.2 AA) & USABILITY AUDIT REPORT

**Audit Standard:** Web Content Accessibility Guidelines (WCAG) 2.2 Level AA  
**Scope:** 134 Frontend Components across `CRM/Frontend/src/app` and `CRM/Frontend/src/components`  
**Auditor:** Principal Accessibility Specialist & Senior UI/UX Lead  
**Audit Date:** October 13, 2026  
**Evidence Artifact:** [`qa_release_audit/evidence/accessibility-audit-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/accessibility-audit-results-fresh.txt)  

---

## 1. Accessibility Conformance Overview

```
+--------------------------------------------------------------------------------+
|                        WCAG 2.2 AA COMPLIANCE SCORECARD                        |
|                                                                                |
|  Total Frontend TSX Components Audited:    134                                 |
|  Form Inputs Missing Programmatic Labels: 90 (Confirmed WCAG 1.3.1 Violation)  |
|  Icon Buttons Missing Accessible Names:     6 (Confirmed WCAG 4.1.2 Violation) |
|  Images Missing Alternative Text:           6 (Confirmed WCAG 1.1.1 Violation) |
|  Low-Contrast Pairings Flagged:             1 (Requires Design Review)         |
|  Overall Conformance Verdict:               NON-CONFORMANT (FAIL)              |
+--------------------------------------------------------------------------------+
```

---

## 2. Forensic Re-examination of Previously Reported Accessibility Findings

### Finding 1: 90 Form Inputs Without Programmatic Labels (WCAG 1.3.1 & 3.3.2)
- **Status:** **CONFIRMED VIOLATION** (P3 Low)
- **Detailed Audit:** Across the 134 components, 90 `<input>` elements rely exclusively on `placeholder` attributes without an associated `<label htmlFor="...">` tag, `aria-label`, or `aria-labelledby`.
- **Screen Reader Impact:** Assistive technologies (JAWS, NVDA, VoiceOver) cannot announce the purpose of the input once text is entered, because placeholder text disappears.
- **Representative Affected Files:**
  - `app/agent/ai-summary/page.tsx:22` (Search/Prompt input)
  - `app/agent/call-center/page.tsx:212` (Dialer phone number input)
  - `app/agent/customers/page.tsx:22` (Customer search input)
  - `app/agent/leads/pool/page.tsx:81` (Lead filter input)
  - `app/agent/profile/page.tsx:70` (Agent profile edit inputs)
- **Remediation:**
  ```tsx
  // Standard compliant implementation:
  <label htmlFor="agent-search-leads" className="sr-only">Search Leads</label>
  <input id="agent-search-leads" type="text" placeholder="Search leads..." className="..." />
  ```

---

### Finding 2: 6 Icon-Only Buttons Missing Accessible Names (WCAG 4.1.2)
- **Status:** **CONFIRMED VIOLATION** (P3 Low)
- **Detailed Audit:** 6 interactive `<button>` elements render only SVG icons (Lucide icons: Filter, Search, Chevron, X) without inner text or `aria-label`.
- **Screen Reader Impact:** Screen readers announce only "button" or "unlabeled button", forcing visually impaired users to guess the function of the control.
- **Affected Locations:**
  - `components/omnichannel/ConversationSidebar.tsx:92` — Toggle sidebar collapse
  - `components/omnichannel-new/OmnichannelApp.tsx:142` — Filter conversations
  - `app/automation/page.tsx:402-404` — Automation step actions
- **Remediation:**
  ```tsx
  <button aria-label="Collapse conversation sidebar" className="...">
    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
  </button>
  ```

---

### Finding 3: 6 Images Missing Alternative Text (WCAG 1.1.1)
- **Status:** **CONFIRMED VIOLATION** (P3 Low)
- **Detailed Audit:** 6 `<img>` tags lack the `alt` attribute.
- **Screen Reader Impact:** Screen readers read out the raw filename or URL path (e.g. `/avatar-default.png`), creating severe auditory clutter.
- **Remediation:** Add `alt="User profile avatar"` for informative images, or `alt="" aria-hidden="true"` for decorative icons.

---

### Finding 4: Low-Contrast Pattern Flag (WCAG 1.4.3)
- **Status:** **ACCEPTABLE WITH REVIEW / NON-BLOCKING**
- **Detailed Audit:** The static scanner flagged `text-gray-300` on `bg-white` in `app/agent/call-center/page.tsx`. Reviewing the actual JSX reveals this class is applied to a disabled placeholder icon, not primary body text. While contrast is 2.1:1 (below the 4.5:1 ratio for normal text), disabled controls are exempted under WCAG 2.2 AA SC 1.4.3.
- **Recommendation:** Increase contrast to `text-slate-500` to improve general legibility.

---

## 3. Usability & User Experience Evaluation

### Usability Friction Points:
1. **Silent Failures on Form Submissions:**  
   Clicking "Save" or "Submit" on administrative forms (`/settings`, `/admin/users`) triggers no loading spinner, toast notification, or backend network mutation. Users are left wondering if their changes were applied.
2. **Empty Table State Misrepresentation:**  
   When `/tickets` loads, it displays hardcoded mock tickets with blank columns due to key name discrepancies (`customerName` vs `customer`), confusing staff members.
3. **Misleading KPI Fallbacks:**  
   When analytics endpoints fail, fallback mock values prevent managers from noticing that their data feeds are disconnected.
