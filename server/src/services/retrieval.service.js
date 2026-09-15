import { getDocumentById } from '../db/documents.queries.js';
import { searchChunksByEmbedding } from '../db/chunks.queries.js';
import { generateEmbeddings } from './embedding.service.js';
import ApiError from '../utils/ApiError.js';

export async function searchDocument(documentId, query, { limit = 8 } = {}) {
  const document = await getDocumentById(documentId);

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  if (document.status !== 'completed') {
    throw new ApiError(
      400,
      `Document is not ready for search (status: ${document.status})`,
    );
  }

  const embeddings = await generateEmbeddings([query]);
  const queryEmbedding = embeddings[0];

  const results = await searchChunksByEmbedding(
    documentId,
    queryEmbedding,
    limit,
  );

  return {
    query,
    documentId,
    results,
  };
}
