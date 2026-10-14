# PARAMANTRA / ELDERCARE CRM — PERFORMANCE & LOAD TESTING REPORT

**Audit Date:** October 13, 2026  
**Auditor:** Principal Performance & Reliability Engineer  
**Target Architecture:** NestJS Backend on Node.js v24.20.0, PostgreSQL (Supabase), Redis Cloud, LiveKit  
**Test Harness:** Custom Node.js Async Benchmarking Engine (`load-test.mjs`, `stress-test.mjs`) & k6 configs (`load-test.k6.js`, `stress-test.k6.js`)  
**Raw Evidence:** `qa/evidence/api-results/load-test-results.txt`, `qa/evidence/api-results/stress-test-results.txt`  

---

## 1. Executive Summary & SLA Adherence

| SLA Criteria | Defined Objective | Measured Reality | Evaluation |
| :--- | :--- | :--- | :---: |
| **Normal Read p95 Latency** | $\le 500\text{ ms}$ | **2433 ms** (Stage 1) / **563 ms** (Stage 2) | **BREACHED** |
| **Normal Read p99 Latency** | $\le 1000\text{ ms}$ | **2482 ms** (Stage 1) / **1862 ms** (Stage 2) | **BREACHED** |
| **HTTP 5xx Error Rate (<25 VUs)** | $< 1.0\%$ | **2.00%** (Stage 3: 3x HTTP 500 errors) | **BREACHED** |
| **Post-Stress Recovery Time** | $\le 500\text{ ms}$ | **3 ms** (Stage 4 Recovery Ping) | **PASSED** |

---

## 2. Load Test Execution Matrix (5, 10, 25 Virtual Users)

Three workload stages were executed consecutively with warm-up and ramp-up profiles against endpoints (`/`, `/telephony/health`, `/api/v1/leads`, `/api/v1/agents`):

```
Stage 1: Baseline Load (5 Concurrent VUs, 50 Target Requests)
Duration: 2.99s | Throughput: 16.70 req/sec
Status Codes: {"200": 50} (100% Success)
Latency: p50 = 14 ms | p90 = 681 ms | p95 = 2433 ms | p99 = 2482 ms

Stage 2: Moderate Load (10 Concurrent VUs, 100 Target Requests)
Duration: 2.22s | Throughput: 45.03 req/sec
Status Codes: {"200": 100} (100% Success)
Latency: p50 = 6 ms | p90 = 521 ms | p95 = 563 ms | p99 = 1862 ms

Stage 3: Elevated Load (25 Concurrent VUs, 150 Target Requests)
Duration: 2.59s | Throughput: 57.88 req/sec
Status Codes: {"200": 147, "500": 3} (Error Rate: 2.00%)
Latency: p50 = 9 ms | p90 = 749 ms | p95 = 763 ms | p99 = 2562 ms
```

### Percentile Latency Curve (Milliseconds):

| Concurrency Level | Requests | p50 | p90 | p95 | p99 | Throughput |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **5 VUs (Baseline)** | 50 | 14 ms | 681 ms | **2433 ms** | 2482 ms | 16.70 req/s |
| **10 VUs (Moderate)** | 100 | 6 ms | 521 ms | **563 ms** | 1862 ms | 45.03 req/s |
| **25 VUs (Elevated)** | 150 | 9 ms | 749 ms | **763 ms** | 2562 ms | 57.88 req/s |

---

## 3. Controlled Stress Test Results (Up to 50 Concurrent Requests)

The stress test subjected the application to instantaneous traffic spikes:
- **Burst 1 (20 Simultaneous Connections):** Duration = 0.08s | Status: 100% 200 OK | p95 = 25ms | p99 = 73ms
- **Burst 2 (35 Simultaneous Connections):** Duration = 0.03s | Status: 100% 200 OK | p95 = 25ms | p99 = 25ms
- **Burst 3 (50 Simultaneous Connections):** Duration = 0.03s | Status: 100% 200 OK | p95 = 23ms | p99 = 23ms
- **Post-Stress Recovery Ping:** Immediately upon burst completion, a health probe responded with `HTTP 200` in **3 ms**.

---

## 4. Bottleneck Identification & Diagnostic Root Causes

### 1. Cloud Redis Network Latency & Timeout Degradation
- **Observation:** `p95` latency spiked to 2433ms in Stage 1 whenever the agent presence endpoint was invoked.
- **Root Cause:** In `CRM/Backend/dist/src/legacy/routes/agents.js:39`, the code queries a remote cloud Redis instance (`redislabs.com:12592`). When network packet drops occur or the remote Redis instance times out, a 2000ms hard timeout blocks the Express/Nest response pipeline.
- **Impact:** Slows down UI page loading and degrades agent call-routing queues.
- **Remediation:** Deploy a local or VPC-colocated Redis container (e.g. AWS ElastiCache / Redis on Docker) and set connection timeout to 150ms with a circuit-breaker fallback to database presence.

### 2. Database Connection Pool Exhaustion under Concurrency
- **Observation:** At 25 concurrent VUs, 3 requests failed with HTTP 500.
- **Root Cause:** Prisma PostgreSQL connection pool default is 17 connections (`prisma:info Starting a postgresql pool with 17 connections`). When 25 requests arrive simultaneously with long-running queries, connection acquisition times out.
- **Remediation:** Configure `DATABASE_URL` with explicit connection pool parameters:
  `postgresql://...?connection_limit=50&pool_timeout=10`
  and implement Prisma connection retries with exponential backoff.
