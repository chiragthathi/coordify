import http from 'k6/http'
import { check } from 'k6'

const profile = __ENV.LOAD_PROFILE || 'local-stepped'

const profileConfig = {
  'local-stepped': {
    startRate: 100,
    preAllocatedVUs: 300,
    maxVUs: 3000,
    stages: [
      { target: 500, duration: '2m' },
      { target: 1500, duration: '3m' },
      { target: 3000, duration: '4m' },
      { target: 5000, duration: '4m' },
      { target: 1000, duration: '2m' },
    ],
  },
  'peak-60k': {
    startRate: 500,
    preAllocatedVUs: 500,
    maxVUs: 5000,
    stages: [
      { target: 5000, duration: '2m' },
      { target: 15000, duration: '3m' },
      { target: 30000, duration: '5m' },
      { target: 60000, duration: '5m' },
      { target: 10000, duration: '2m' },
    ],
  },
}

const activeProfile = profileConfig[profile] || profileConfig['local-stepped']

export const options = {
  scenarios: {
    load_profile: {
      executor: 'ramping-arrival-rate',
      startRate: activeProfile.startRate,
      timeUnit: '1s',
      preAllocatedVUs: activeProfile.preAllocatedVUs,
      maxVUs: activeProfile.maxVUs,
      stages: activeProfile.stages,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4100'

export default function () {
  const paths = ['/health', '/api/v1/projects', '/api/v1/tasks', '/api/v1/reports']
  const path = paths[Math.floor(Math.random() * paths.length)]
  const syntheticUserId = `load-user-${__VU}-${__ITER % 5000}`

  const response = http.get(`${BASE_URL}${path}`, {
    headers: {
      'x-user-role': 'admin',
      'x-user-id': syntheticUserId,
    },
  })

  check(response, {
    'status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
  })
}
