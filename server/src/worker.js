import 'dotenv/config';
import Redis from 'ioredis';
import { Worker } from 'bullmq';
import { QUEUE_NAMES, BULL_PREFIX } from './redis/queue.js';
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

async function shutdown() {
  console.log('Shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('Worker started, listening for extraction jobs...');
