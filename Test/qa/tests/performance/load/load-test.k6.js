// qa/tests/performance/load/load-test.k6.js
// Standard k6 Load Testing Script for Paramantra / ElderCare CRM
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },  // Ramp-up to 5 VUs (Baseline)
    { duration: '1m', target: 5 },   // Hold 5 VUs
    { duration: '30s', target: 10 }, // Ramp-up to 10 VUs (Moderate)
    { duration: '1m', target: 10 },  // Hold 10 VUs
    { duration: '30s', target: 25 }, // Ramp-up to 25 VUs (Elevated)
    { duration: '1m', target: 25 },  // Hold 25 VUs
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // SLA thresholds
    http_req_failed: ['rate<0.01'],                  // <1% error rate
  },
};

const BASE_URL = __ENV.CRM_API_URL || 'http://localhost:4000';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/telephony/health`],
    ['GET', `${BASE_URL}/api/v1/leads`],
  ]);

  check(responses[0], { 'root status is 200': (r) => r.status === 200 });
  check(responses[1], { 'telephony status is 200': (r) => r.status === 200 });
  check(responses[2], { 'leads status is 200': (r) => r.status === 200 });

  sleep(1);
}
