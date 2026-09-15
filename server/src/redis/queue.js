import Redis from 'ioredis';
import { Queue } from 'bullmq';

// Dedicated connection for BullMQ — maxRetriesPerRequest: null is required
// because BullMQ uses blocking commands that standard ioredis config would reject.
// Separate from redis/client.js which serves cache/session/rate-limit concerns.
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  DOCUMENT_EXTRACT: 'document-extract',
  DOCUMENT_EMBED: 'document-embed',
};

// BullMQ forbids colons in queue names (reserved as internal key separator).
// The prefix option namespaces all Redis keys under `queue:*`, consistent
// with AGENTS.md's key convention — effective keys: `queue:document-extract:*`.
export const BULL_PREFIX = 'queue';

// Job payloads for this queue carry a base64-encoded file buffer (~few MB for
// a ~200-page PDF). This is intentional — the API and worker are separate
// processes with no shared memory, and no storage bucket is used for file
// transit. See AGENTS.md for the full rationale.
export const extractionQueue = new Queue(QUEUE_NAMES.DOCUMENT_EXTRACT, {
  connection,
  prefix: BULL_PREFIX,
});

export const embeddingQueue = new Queue(QUEUE_NAMES.DOCUMENT_EMBED, {
  connection,
  prefix: BULL_PREFIX,
});

