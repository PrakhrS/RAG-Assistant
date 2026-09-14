// Temporary dev script — delete after use.
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDocumentById } from '../src/db/documents.queries.js';
import { chunkText } from '../src/utils/chunker.js';

const documentId = process.argv[2];
if (!documentId) {
  console.error('Usage: node scripts/inspect-chunks.js <document-id>');
  process.exit(1);
}

const doc = await getDocumentById(documentId);

if (!doc) {
  console.error(`No document found for id ${documentId}`);
  process.exit(1);
}
if (doc.status !== 'completed') {
  console.error(`Status is "${doc.status}", not "completed" yet.`);
  process.exit(1);
}

const chunks = chunkText(doc.rawText);
const wordCounts = chunks.map((c) => c.content.split(' ').length);
const min = Math.min(...wordCounts);
const max = Math.max(...wordCounts);
const avg = (wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length).toFixed(1);

// Build full output — each chunk separated clearly
const lines = [];
lines.push('='.repeat(80));
lines.push(`Document : ${doc.filename}`);
lines.push(`ID       : ${documentId}`);
lines.push(`Chunks   : ${chunks.length}`);
lines.push(`Words    : min=${min}  avg=${avg}  max=${max}`);
lines.push('='.repeat(80));
lines.push('');

chunks.forEach((c, i) => {
  lines.push(`--- Chunk ${i} (${wordCounts[i]} words) ${'─'.repeat(60)}`);
  lines.push(c.content);
  lines.push('');
});

const output = lines.join('\n');

// Write to server/chunkingoutput/<documentId>.txt
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'chunkingoutput');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${documentId}.txt`);
writeFileSync(outPath, output, 'utf-8');

// Also print the summary to console so you know it worked
console.log(`Document : ${doc.filename}`);
console.log(`Chunks   : ${chunks.length}`);
console.log(`Words    : min=${min}  avg=${avg}  max=${max}`);
console.log(`\nFull output written to:\n  ${outPath}`);