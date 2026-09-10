import { pool } from './index.js';

const COLUMN_MAP = {
  id: 'id',
  filename: 'filename',
  file_size: 'fileSize',
  mime_type: 'mimeType',
  status: 'status',
  page_count: 'pageCount',
  error_message: 'errorMessage',
  raw_text: 'rawText',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

function toCamelCase(row) {
  if (!row) return null;
  const result = {};
  for (const [snakeKey, camelKey] of Object.entries(COLUMN_MAP)) {
    if (snakeKey in row) {
      result[camelKey] = row[snakeKey];
    }
  }
  return result;
}

export async function insertDocument({ filename, fileSize, mimeType }) {
  const { rows } = await pool.query(
    `INSERT INTO documents (filename, file_size, mime_type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [filename, fileSize, mimeType],
  );
  return toCamelCase(rows[0]);
}

export async function getDocumentById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM documents WHERE id = $1',
    [id],
  );
  return toCamelCase(rows[0]);
}

export async function updateDocumentStatus(
  id,
  status,
  { errorMessage = null, rawText = null, pageCount = null } = {},
) {
  const { rows } = await pool.query(
    `UPDATE documents
     SET status = $1, error_message = $2, raw_text = $3, page_count = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [status, errorMessage, rawText, pageCount, id],
  );
  return toCamelCase(rows[0]);
}
