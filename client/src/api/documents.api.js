import { request, UPLOAD_TIMEOUT_MS, POLL_TIMEOUT_MS } from './http.js';

export async function uploadDocument(file, signal) {
  const formData = new FormData();
  formData.append('file', file);

  return request('/documents', {
    method: 'POST',
    body: formData,
  }, UPLOAD_TIMEOUT_MS, signal);
}

export async function getDocumentStatus(documentId, signal) {
  return request(`/documents/${documentId}`, {
    method: 'GET',
  }, POLL_TIMEOUT_MS, signal);
}
