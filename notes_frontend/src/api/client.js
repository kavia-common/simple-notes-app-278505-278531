/**
 * Lightweight API client using fetch with:
 * - Base URL pointing to backend on port 3001 on same host
 * - AbortController-based timeout (~10s)
 * - Safe JSON parsing and consistent error handling
 */

const DEFAULT_TIMEOUT_MS = 10000;

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = 'GET', headers = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  /** Performs a JSON API request with robust error handling. */
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const base = `${window.location.protocol}//${window.location.hostname}:3001`;
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const opts = {
    method,
    headers: finalHeaders,
    signal: controller.signal,
  };

  if (body !== undefined && body !== null) {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, opts);
    clearTimeout(id);

    const text = await res.text().catch(() => '');
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON response
        data = text;
      }
    }

    if (!res.ok) {
      const message =
        (data && (data.detail || data.message || data.error)) ||
        `Request failed with status ${res.status}`;
      return { ok: false, status: res.status, error: message, data: null };
    }

    return { ok: true, status: res.status, error: null, data };
  } catch (err) {
    clearTimeout(id);
    const isAbort = err && err.name === 'AbortError';
    const message = isAbort ? 'Request timed out' : 'Network error';
    return { ok: false, status: 0, error: message, data: null };
  }
}
