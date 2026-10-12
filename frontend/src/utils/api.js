/**
 * Resilient API Client for Web Intelligence Platform
 * Completely prevents "Unexpected token < in JSON at position 0" and JSON parse crashes.
 */

// If deployed on GitHub Pages or custom domain, target the live Render gateway
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname.includes('github.io') ? 'https://web-intelligence.onrender.com' : '');

export function safeJsonParse(raw, fallback = null) {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Enhanced fetch wrapper that safely decodes JSON and standardizes error responses.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('webintel_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If there's a JSON body object, serialize it
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(body);
  }

  // Prepend API_BASE_URL if endpoint starts with /api
  const targetUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let res;
  try {
    res = await fetch(targetUrl, {
      ...options,
      headers,
      body
    });
  } catch (netErr) {
    const errorMsg = netErr.message?.includes('Failed to fetch')
      ? 'Unable to connect to intelligence gateway. Please verify the backend service is reachable.'
      : `Network error: ${netErr.message}`;
    throw new Error(errorMsg);
  }

  // Read response body safely without throwing on HTML/text
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  let text = '';

  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      text = await res.text();
      // Try parsing in case server sent json with wrong content-type
      if (text.startsWith('{') || text.startsWith('[')) {
        data = JSON.parse(text);
      }
    }
  } catch (parseErr) {
    console.warn(`[apiFetch] Response from ${targetUrl} was not valid JSON:`, parseErr.message);
  }

  if (!res.ok) {
    let message = data?.error || data?.message;
    if (!message) {
      if (res.status === 401) {
        message = 'Authentication required. Your session may have expired.';
      } else if (res.status === 403) {
        message = 'Access denied: Administrator privileges required.';
      } else if (res.status === 404) {
        message = `Resource not found (HTTP 404): ${targetUrl}`;
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        message = `Gateway unavailable (HTTP ${res.status}). Verify the backend server is running.`;
      } else {
        message = `Request failed with HTTP status ${res.status}`;
      }
    }
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data !== null ? data : text;
}

export const api = {
  get: (url, options) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiFetch(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => apiFetch(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options) => apiFetch(url, { ...options, method: 'PATCH', body }),
  delete: (url, body, options) => apiFetch(url, { ...options, method: 'DELETE', body })
};
