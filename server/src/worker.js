import 'dotenv/config';
import Redis from 'ioredis';
import { Worker } from 'bullmq';
import { QUEUE_NAMES, BULL_PREFIX } from './redis/queue.js';
import { generateEmbeddings } from './services/embedding.service.js';
import { bulkInsertChunks } from './db/chunks.queries.js';
import { updateDocumentStatus } from './db/documents.queries.js';
import { extractText } from './services/document.service.js';

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  QUEUE_NAMES.DOCUMENT_EXTRACT,
  async (job) => {
    const { documentId, fileBuffer, mimeType } = job.data;
    const buffer = Buffer.from(fileBuffer, 'base64');
    await extractText(documentId, buffer, mimeType);
  },
  { connection, prefix: BULL_PREFIX },
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed for document ${job.data.documentId}`);
});

worker.on('failed', (job, err) => {
  console.log(
    `Job ${job.id} failed for document ${job.data.documentId}: ${err.message}`,
  );
});

// Both workers share one process for MVP simplicity. If CPU-heavy
// transformer inference blocks PDF parsing (or vice versa), split
// into separate processes.
const embeddingWorker = new Worker(
  QUEUE_NAMES.DOCUMENT_EMBED,
  async (job) => {
    const { documentId, chunks } = job.data;
    try {
      const texts = chunks.map((c) => c.content);
      const embeddings = await generateEmbeddings(texts);
      const chunksWithEmbeddings = chunks.map((chunk, i) => ({
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: embeddings[i],
      }));
      await bulkInsertChunks(documentId, chunksWithEmbeddings);
      await updateDocumentStatus(documentId, 'completed');
    } catch (err) {
      await updateDocumentStatus(documentId, 'failed', {
        errorMessage: 'Embedding generation failed: ' + err.message,
      });
      throw err;
    }
  },
  { connection, prefix: BULL_PREFIX },
);

embeddingWorker.on('completed', (job) => {
  console.log(`Embedding job ${job.id} completed for document ${job.data.documentId}`);
});

embeddingWorker.on('failed', (job, err) => {
  console.log(
    `Embedding job ${job.id} failed for document ${job.data.documentId}: ${err.message}`,
  );
});

async function shutdown() {
  console.log('Shutting down workers...');
  await worker.close();
  await embeddingWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('Workers started, listening for extraction and embedding jobs...');
