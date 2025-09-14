// load-tests/k6-load-test.js
// Requires k6 (https://k6.io). Example run:
// k6 run --vus 100 --duration 1m load-tests/k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests below 500ms
    http_req_failed: ['rate<0.01'],   // <1% error rate
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost';

export default function () {
  const endpoints = [
    '/',
    '/aptos',
    '/builders',
    '/api/v1/aptos/',
    '/api/v1/builders/',
  ];

  for (const path of endpoints) {
    const res = http.get(`${BASE}${path}`);
    check(res, {
      'status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
    });
    sleep(0.2);
  }
}

