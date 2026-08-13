import axios from 'axios';
import { reactive } from 'vue';

type ServerStatus = 'idle' | 'checking' | 'ready' | 'failed';

const SLOW_RESPONSE_DELAY = 4_000;
const READINESS_TIMEOUT = 90_000;
const HEALTH_REQUEST_TIMEOUT = 10_000;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export const serverReadiness = reactive<{
  status: ServerStatus;
  isBlocking: boolean;
  isSlow: boolean;
}>({
  status: 'idle',
  isBlocking: false,
  isSlow: false,
});

let readinessCheck: Promise<void> | null = null;
let readyPromise: Promise<void> | null = null;
let resolveReady: (() => void) | null = null;
let slowResponseTimer: number | null = null;

function delay(duration: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

function getReadyPromise() {
  if (!readyPromise) {
    readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
  }

  return readyPromise;
}

async function pollServerReadiness() {
  const deadline = Date.now() + READINESS_TIMEOUT;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;

    try {
      await axios.get(`${apiBaseUrl}/health`, {
        headers: { Accept: 'application/json' },
        timeout: HEALTH_REQUEST_TIMEOUT,
      });
      return;
    } catch {
      if (Date.now() >= deadline) break;
      await delay(Math.min(1_000 + attempt * 350, 3_000));
    }
  }

  throw new Error('Server belum siap.');
}

function beginReadinessCheck() {
  if (readinessCheck) return readinessCheck;

  serverReadiness.status = 'checking';
  serverReadiness.isSlow = false;

  slowResponseTimer = window.setTimeout(() => {
    if (serverReadiness.status === 'checking') {
      serverReadiness.isSlow = true;
    }
  }, SLOW_RESPONSE_DELAY);

  readinessCheck = pollServerReadiness()
    .then(() => {
      serverReadiness.status = 'ready';
      serverReadiness.isBlocking = false;
      serverReadiness.isSlow = false;
      resolveReady?.();
      resolveReady = null;
      readyPromise = null;
    })
    .catch(() => {
      serverReadiness.status = 'failed';
      serverReadiness.isSlow = true;
    })
    .finally(() => {
      if (slowResponseTimer !== null) {
        window.clearTimeout(slowResponseTimer);
        slowResponseTimer = null;
      }
      readinessCheck = null;
    });

  return readinessCheck;
}

export function startServerWarmup() {
  if (serverReadiness.status === 'ready' || readinessCheck) return;

  void beginReadinessCheck();
}

export async function waitForServer() {
  if (serverReadiness.status === 'ready') return;

  const shouldStartCheck =
    serverReadiness.status === 'idle' ||
    (serverReadiness.status === 'failed' && !serverReadiness.isBlocking);
  serverReadiness.isBlocking = true;
  const pendingReadiness = getReadyPromise();

  if (shouldStartCheck) {
    void beginReadinessCheck();
  }

  await pendingReadiness;
}

export async function retryServerConnection() {
  if (serverReadiness.status === 'ready') return;

  serverReadiness.isBlocking = true;
  getReadyPromise();
  await beginReadinessCheck();
}
