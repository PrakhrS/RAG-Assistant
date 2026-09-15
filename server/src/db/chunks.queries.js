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
