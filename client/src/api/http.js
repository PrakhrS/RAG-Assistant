export const ASK_TIMEOUT_MS = 45_000;
export const UPLOAD_TIMEOUT_MS = 60_000;
export const POLL_TIMEOUT_MS = 10_000;

const baseUrl = import.meta.env.VITE_API_BASE_URL;
if (!baseUrl) {
  throw new Error('VITE_API_BASE_URL is not defined. Set it in client/.env.');
}

/**
 * Normalizes HTTP, timeout, network, and abort errors.
 */
function normalizeError(err, status) {
  if (err.name === 'AbortError') {
    return { kind: 'timeout', message: 'The request took too long. Try again.' }; // Temporary default, logic will be handled outside
  }
  if (err.name === 'TypeError') {
    return { kind: 'network', message: err.message };
  }
  return { kind: 'http', status, message: err.message || 'Unknown error' };
}

/**
 * Base request function.
 */
export async function request(path, options = {}, timeoutMs, externalSignal = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const signal = externalSignal
    ? AbortSignal.any([controller.signal, externalSignal])
    : controller.signal;

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api${path}`;
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errMessage = 'A server error occurred.';
      try {
        const body = await response.json();
        if (body.error && body.error.message) {
          errMessage = body.error.message;
        }
      } catch {
        // Body isn't JSON, ignore
      }
      throw Object.assign(new Error(errMessage), { status: response.status });
    }

    const data = await response.json();
    return data.data !== undefined ? data.data : data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      // Check which signal caused the abort
      if (controller.signal.aborted && (!externalSignal || !externalSignal.aborted)) {
        throw { kind: 'timeout', message: 'The request took too long. Try again.' };
      } else {
        throw { kind: 'aborted', message: 'The request was cancelled.' };
      }
    }

    throw normalizeError(err, err.status);
  }
}
