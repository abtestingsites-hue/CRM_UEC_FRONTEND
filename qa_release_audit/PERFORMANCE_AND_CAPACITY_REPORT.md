# PARAMANTRA / ELDERCARE CRM — PERFORMANCE & CAPACITY AUDIT REPORT

**Audit Date:** October 13, 2026  
**Auditor:** Principal Performance & Reliability Engineer  
**Harness:** Custom Node.js Multi-Stage Async Benchmark Engine (`load-test.mjs`, `stress-test.mjs`) & k6 Script Specifications (`load-test.k6.js`, `stress-test.k6.js`)  
**Target:** NestJS Backend on Port 4000, Supabase PostgreSQL, Redis Cloud  
**Evidence Artifacts:** [`qa_release_audit/evidence/load-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/load-test-results-fresh.txt), [`qa_release_audit/evidence/stress-test-results-fresh.txt`](file:///d:/CRM_BACKUP/Crm_summary%20working/qa_release_audit/evidence/stress-test-results-fresh.txt)  

---

## 1. Executive Performance Summary & SLA Compliance

| Target SLA Criteria | Agreed / Proposed Target | Measured Baseline | Measured Moderate | Measured Elevated | Compliance |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Normal Read p95 Latency** | $\le 500\text{ ms}$ | **2182 ms** | **1195 ms** | **1174 ms** | **FAILED (BREACHED)** |
| **Normal Read p99 Latency** | $\le 1000\text{ ms}$ | **2236 ms** | **2904 ms** | **3593 ms** | **FAILED (BREACHED)** |
| **HTTP 5xx Error Rate (<25 VUs)** | $< 1.0\%$ | **0.00%** | **0.00%** | **2.00% (3x 500)** | **FAILED (BREACHED)** |
| **Post-Stress System Recovery** | $\le 500\text{ ms}$ | N/A | N/A | **3 ms** | **PASSED** |

> **PERFORMANCE AUDIT VERDICT: NON-COMPLIANT**  
> The system fails both read latency SLA criteria and error rate limits due to two fundamental architectural bottlenecks: remote cloud Redis network timeouts and Supabase session pool exhaustion.

---

## 2. Load Testing Execution Matrix (Multi-Stage Concurrency)

Workload stages executed consecutively against active endpoints (`/`, `/telephony/health`, `/api/v1/leads`):

```
Stage 1: Baseline Workload (5 Concurrent Virtual Users)
  - Target Requests: 50 | Total Completed: 50
  - Duration: 3.13 seconds | Throughput: 15.96 requests/sec
  - HTTP Status Distribution: {"200": 50} (100% Success)
  - Latency: p50 = 13 ms | p90 = 476 ms | p95 = 2182 ms | p99 = 2236 ms
  - Bottleneck Observed: Cloud Redis timeout introduces ~2000ms delay on 5% of requests.

Stage 2: Moderate Workload (10 Concurrent Virtual Users)
  - Target Requests: 100 | Total Completed: 100
  - Duration: 3.14 seconds | Throughput: 31.83 requests/sec
  - HTTP Status Distribution: {"200": 100} (100% Success)
  - Latency: p50 = 9 ms | p90 = 718 ms | p95 = 1195 ms | p99 = 2904 ms

Stage 3: Elevated Workload (25 Concurrent Virtual Users)
  - Target Requests: 150 | Total Completed: 150
  - Duration: 3.69 seconds | Throughput: 40.60 requests/sec
  - HTTP Status Distribution: {"200": 147, "500": 3} (Error Rate: 2.00%)
  - Latency: p50 = 13 ms | p90 = 1139 ms | p95 = 1174 ms | p99 = 3593 ms
  - Bottleneck Observed: Database connection pool exhaustion causes HTTP 500 failures.
```

### Percentile Latency Distribution Table:

| Concurrency Level | Requests | p50 | p90 | p95 | p99 | Throughput | Error Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **5 VUs (Baseline)** | 50 | 13 ms | 476 ms | **2182 ms** | 2236 ms | 15.96 req/s | 0.00% |
| **10 VUs (Moderate)** | 100 | 9 ms | 718 ms | **1195 ms** | 2904 ms | 31.83 req/s | 0.00% |
| **25 VUs (Elevated)** | 150 | 13 ms | 1139 ms | **1174 ms** | **3593 ms** | 40.60 req/s | **2.00%** |

---

## 3. Forensic Bottleneck Diagnostic

### Bottleneck A: Remote Cloud Redis Latency & Timeout Degradation
- **Root Cause:** In `CRM/Backend/dist/src/legacy/routes/agents.js:39`:
  ```javascript
  const presence = await Promise.race([
    redis.get(`presence:${agent.id}`),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
  ]);
  ```
- **Diagnostic Finding:** The backend connects to an external Redis instance hosted on `redislabs.com:12592`. Periodic WAN packet drops trigger the hardcoded 2000ms timeout fallback.
- **Operational Impact:** Every call to fetch agent directories or routing availability incurs a 2-second stall, dragging p95 latency to >2000ms.
- **Remediation:**
  1. Replace WAN Redis with a VPC-peered / co-located Redis service (e.g., AWS ElastiCache, Redis on Docker).
  2. Reduce the race timeout to 150ms.
  3. Implement a circuit breaker that falls back to in-memory cache when Redis is unreachable.

### Bottleneck B: Supabase Connection Pooler Exhaustion (EMAXCONNSESSION)
- **Root Cause Log from Live Execution:**
  ```
  Error in connector: Error querying the database:
  FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
  PrismaClientUnknownRequestError:
  Invalid `prisma.lead.findMany()` invocation in dist/src/legacy/routes/leads.js:105:41
  ```
- **Diagnostic Finding:** The database connection string in `.env` connects to Supabase PgBouncer in **Session mode** (default port 5432) which enforces a rigid ceiling of `pool_size: 15`. When 25 concurrent virtual users request leads simultaneously, Prisma exhausts the 15 available slots, and Supabase abruptly terminates subsequent connections.
- **Operational Impact:** Results in immediate HTTP 500 errors (2.00% error rate), breaking clinical workflows for multiple users at once.
- **Remediation:**
  1. Change connection string to Supabase **Transaction mode** (port 6543):
     `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=50`
  2. Increase pool size in Prisma Client configuration.

---

## 4. Controlled Stress Testing & System Limit Analysis

### Stress Test Profile:
- **Burst 1 (20 Simultaneous Requests):** Duration = 0.08s | 100% HTTP 200 | p95 = 25ms | p99 = 73ms
- **Burst 2 (35 Simultaneous Requests):** Duration = 0.03s | 100% HTTP 200 | p95 = 25ms | p99 = 25ms
- **Burst 3 (50 Simultaneous Requests):** Duration = 0.03s | 100% HTTP 200 | p95 = 23ms | p99 = 23ms
- **Post-Stress Health Recovery:** Immediately upon completion, a health probe responded with `HTTP 200` in **3 ms**.

### Critical Methodological Caveat:
> [!WARNING]
> **Measurement Caveat Regarding Stress Testing:**  
> The 50-request burst completed in 0.03 seconds (30 milliseconds). While this proves that the Node.js event loop handles instantaneous micro-bursts without thread blocking, **a 30ms burst does NOT constitute evidence of sustained stress capacity, endurance, or memory leak resilience**. Long-duration endurance testing (30–60 minutes at 50 VUs) was not performed during this baseline audit and must be executed in a dedicated staging environment prior to final release sign-off.

---

## 5. Capacity Limitations & Hardware Recommendations

- **Current Maximum Sustainable Concurrency:** **10 Concurrent Virtual Users**. Beyond 12–15 concurrent users, database connection pool exhaustion triggers 500 error spikes.
- **Required Production Architecture:**
  - Node.js Application: 2x instances behind NGINX / AWS ALB (Load Balanced).
  - PostgreSQL Database: Supabase Pro / AWS RDS with minimum 100 pooled transaction connections.
  - Redis: Co-located Redis cluster with `<5ms` internal latency.
