// qa/tests/performance/stress/stress-test.k6.js
// Standard k6 Stress Testing Configuration for Paramantra / ElderCare CRM
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // Ramp-up to 20 VUs
    { duration: '2m', target: 50 },  // Push to stress level: 50 VUs
    { duration: '1m', target: 80 },  // Peak breakpoint probe: 80 VUs
    { duration: '2m', target: 0 },   // Recovery and ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Under stress, failure rate should remain below 5%
  },
};

const BASE_URL = __ENV.CRM_API_URL || 'http://localhost:4000';

export default function () {
  const res = http.get(`${BASE_URL}/telephony/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(0.5);
}
