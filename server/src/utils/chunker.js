/**
 * Splits raw extracted text into overlapping word-based chunks sized to stay
 * safely under the embedding model's 256-token sequence limit
 * (Xenova/all-MiniLM-L6-v2, ~1.3 tokens/word → 180 words ≈ 234 tokens).
 *
 * @param {string} rawText - Full extracted text from a document's raw_text column.
 * @param {object} [options]
 * @param {number} [options.chunkSize=180]    - Target words per chunk.
 * @param {number} [options.chunkOverlap=25]  - Words of overlap between consecutive chunks.
 * @returns {Array<{ content: string, chunkIndex: number }>}
 */
export function chunkText(rawText, { chunkSize = 180, chunkOverlap = 25 } = {}) {
  // Collapse all Unicode whitespace runs (tabs, newlines, \r, NBSP, etc.)
  // into single spaces — pdf.js and mammoth both produce irregular spacing.
  const normalized = rawText.trim().replace(/\s+/g, ' ');

  if (!normalized) return [];

  const words = normalized.split(' ');

  if (words.length <= chunkSize) {
    return [{ content: normalized, chunkIndex: 0 }];
  }

  const stride = chunkSize - chunkOverlap;
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const slice = words.slice(i, i + chunkSize);

    // If what remains after this window is a sliver smaller than the overlap,
    // absorb it here rather than emitting a near-empty trailing chunk that
    // would produce a meaningless embedding.
    const remaining = words.length - (i + chunkSize);
    if (remaining > 0 && remaining < chunkOverlap) {
      chunks.push({
        content: words.slice(i, i + chunkSize + remaining).join(' '),
        chunkIndex: chunks.length,
      });
      break;
    }

    chunks.push({ content: slice.join(' '), chunkIndex: chunks.length });

    if (i + chunkSize >= words.length) break;
    i += stride;
  }

  return chunks;
}
