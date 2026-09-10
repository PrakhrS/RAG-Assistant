import ApiError from '../utils/ApiError.js';
import { createDocument } from '../services/document.service.js';
import { getDocumentById } from '../db/documents.queries.js';

export async function uploadDocument(req, res) {
  if (!req.file) {
    throw new ApiError(400, 'No file provided');
  }

  const document = await createDocument(req.file);
  res.status(202).json({ data: document });
}

export async function getDocumentStatus(req, res) {
  const document = await getDocumentById(req.params.id);

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  res.status(200).json({ data: document });
}
