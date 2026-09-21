import 'dotenv/config';
import { readFileSync } from 'fs';
import { getDocumentById } from '../src/db/documents.queries.js';
import { searchChunksByEmbedding } from '../src/db/chunks.queries.js';
import { generateEmbeddings } from '../src/services/embedding.service.js';

const documentId = process.argv[2];
const questionsPath = process.argv[3];

if (!documentId || !questionsPath) {
  console.error('Usage: node server/scripts/calibrate-threshold.js <documentId> <questions.json>');
  process.exit(1);
}

const doc = await getDocumentById(documentId);
if (!doc) {
  console.error(`No document found for id ${documentId}`);
  process.exit(1);
}
if (doc.status !== 'completed') {
  console.error(`Document status is "${doc.status}", must be "completed" to calibrate.`);
  process.exit(1);
}

let questionsData;
try {
  questionsData = JSON.parse(readFileSync(questionsPath, 'utf-8'));
} catch (e) {
  console.error(`Failed to read or parse questions JSON file: ${e.message}`);
  process.exit(1);
}

const { relevant = [], irrelevant = [] } = questionsData;
if (!relevant.length || !irrelevant.length) {
  console.error('JSON file must contain "relevant" and "irrelevant" string arrays with at least 1 question each.');
  process.exit(1);
}

async function testQueries(type, queries) {
  console.log(`\n=== Testing ${type.toUpperCase()} Questions ===`);
  for (const q of queries) {
    console.log(`\nQ: "${q}"`);
    const [embedding] = await generateEmbeddings([q]);
    const results = await searchChunksByEmbedding(documentId, embedding, 8);
    
    if (results.length === 0) {
      console.log('  No chunks retrieved (should not happen with pgvector).');
      continue;
    }

    const scores = results.map(r => r.similarity.toFixed(4));
    console.log(`  Top 8 scores : ${scores.join(', ')}`);
    console.log(`  Max score    : ${scores[0]}`);
    console.log(`  Min score    : ${scores[scores.length - 1]}`);
  }
}

console.log('Loading embedding model... (this may take a moment)');
// Force lazy load
await generateEmbeddings(['warmup']);

console.log(`\nCalibrating threshold for Document: ${doc.filename} (${documentId})`);

await testQueries('relevant', relevant);
await testQueries('irrelevant', irrelevant);

console.log(`
================================================================================
CALIBRATION COMPLETE
Compare the Max scores from the IRRELEVANT questions against the Min/Max scores 
of the RELEVANT questions.
Your goal is to choose a SIMILARITY_THRESHOLD in .env that is:
- HIGHER than the max scores of irrelevant questions.
- LOWER than the max scores of relevant questions (so relevant chunks pass).
================================================================================
`);
process.exit(0);
