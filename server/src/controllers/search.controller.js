import { searchDocument } from '../services/retrieval.service.js';
import ApiError from '../utils/ApiError.js';

export async function searchDocumentChunks(req, res) {
  if (!req.body || typeof req.body !== 'object') {
    throw new ApiError(400, 'Request body is required');
  }

  const { documentId, query, limit } = req.body;

  if (!documentId || !query) {
    throw new ApiError(400, 'documentId and query are required');
  }

  const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 8;
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    throw new ApiError(400, 'limit must be a positive integer');
  }

  const result = await searchDocument(documentId, query, {
    limit: parsedLimit,
  });

  res.status(200).json(result);
}
