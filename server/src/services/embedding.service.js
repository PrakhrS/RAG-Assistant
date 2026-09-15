import { pipeline } from '@huggingface/transformers';

let pipelinePromise = null;

export async function loadModel() {
  if (!pipelinePromise) {
    pipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return pipelinePromise;
}

export async function generateEmbeddings(texts) {
  if (texts.length === 0) return [];

  const pipe = await loadModel();
  
  // TODO: If large documents (~200 pages, several hundred chunks) cause memory spikes from one huge batch, implement sub-batching (e.g. groups of 32).
  const result = await pipe(texts, { pooling: 'mean', normalize: true });
  
  return result.tolist();
}
