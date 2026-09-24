import { request, ASK_TIMEOUT_MS } from './http.js';

export async function askQuestion(documentId, question, signal) {
  return request('/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId, question }),
  }, ASK_TIMEOUT_MS, signal);
}
