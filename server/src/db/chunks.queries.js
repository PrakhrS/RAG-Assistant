import { pool } from './index.js';

export async function bulkInsertChunks(documentId, chunksWithEmbeddings) {
  if (chunksWithEmbeddings.length === 0) return 0;

  const values = [];
  const queryValues = [];
  let paramIndex = 1;

  for (const chunk of chunksWithEmbeddings) {
    const p1 = paramIndex++;
    const p2 = paramIndex++;
    const p3 = paramIndex++;
    const p4 = paramIndex++;

    values.push(`($${p1}, $${p2}, $${p3}::vector, $${p4})`);
    
    queryValues.push(documentId);
    queryValues.push(chunk.content);
    queryValues.push(`[${chunk.embedding.join(',')}]`);
    queryValues.push(chunk.chunkIndex);
  }

  const query = `
    INSERT INTO chunks (document_id, content, embedding, chunk_index)
    VALUES ${values.join(', ')}
  `;

  const { rowCount } = await pool.query(query, queryValues);
  return rowCount;
}

const SEARCH_COLUMN_MAP = {
  id: 'id',
  content: 'content',
  chunk_index: 'chunkIndex',
  similarity: 'similarity',
  document_id: 'documentId',
  filename: 'filename',
};

function searchRowToCamelCase(row) {
  if (!row) return null;
  const result = {};
  for (const [snakeKey, camelKey] of Object.entries(SEARCH_COLUMN_MAP)) {
    if (snakeKey in row) {
      result[camelKey] = row[snakeKey];
    }
  }
  // similarity comes back as a string from pg — coerce to number
  if (result.similarity != null) {
    result.similarity = Number(result.similarity);
  }
  return result;
}

export async function searchChunksByEmbedding(documentId, queryEmbedding, limit = 8) {
  const embeddingLiteral = `[${queryEmbedding.join(',')}]`;

  const { rows } = await pool.query(
    `SELECT c.id, c.content, c.chunk_index,
            1 - (c.embedding <=> $1::vector) AS similarity,
            d.id AS document_id, d.filename
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     WHERE c.document_id = $2
     ORDER BY c.embedding <=> $1::vector
     LIMIT $3`,
    [embeddingLiteral, documentId, limit],
  );

  return rows.map(searchRowToCamelCase);
}
