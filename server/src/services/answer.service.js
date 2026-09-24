import { searchDocument } from './retrieval.service.js';
import { buildPrompt } from '../utils/promptBuilder.js';
import { generate } from './llm.service.js';
import { NO_ANSWER_SENTENCE } from '../utils/noAnswerSentence.js';

/**
 * Orchestrates the retrieval and LLM answer generation pipeline.
 *
 * @param {string} documentId
 * @param {string} question
 */
export async function generateAnswer(documentId, question) {
  const rawLimit = parseInt(process.env.RETRIEVAL_LIMIT, 10);
  const RETRIEVAL_LIMIT = isNaN(rawLimit) ? 8 : rawLimit;

  // 1. Retrieve chunks
  // (searchDocument already validates document existence and status)
  const retrievalResult = await searchDocument(documentId, question, { limit: RETRIEVAL_LIMIT });
  const results = retrievalResult.results;

  // 2. Filter by similarity threshold
  const rawThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD);
  const SIMILARITY_THRESHOLD = isNaN(rawThreshold) ? 0.3 : rawThreshold;
  
  const filtered = results.filter(r => r.similarity >= SIMILARITY_THRESHOLD);

  // 3. Short-circuit if no relevant chunks found
  if (filtered.length === 0) {
    return {
      answer: NO_ANSWER_SENTENCE,
      answered: false,
      truncated: false,
      sources: [],
      provider: null,
      model: null,
    };
  }

  // 4. Build prompt
  const prompt = buildPrompt(question, filtered);

  // 5. Call LLM
  const llmResult = await generate(prompt);

  // Normalize: if the LLM parrots the "no answer" sentence exactly, treat it as
  // answered: false so the client doesn't render sources against a refusal.
  if (llmResult.text.trim() === NO_ANSWER_SENTENCE) {
    return {
      answer: NO_ANSWER_SENTENCE,
      answered: false,
      truncated: false,
      sources: [],
      provider: llmResult.provider,  // keep — the LLM was called
      model: llmResult.model,
    };
  }

  // 6. Shape result
  return {
    answer: llmResult.text,
    answered: true,
    truncated: llmResult.truncated || false,
    sources: filtered.map((chunk, i) => ({
      index: i + 1, // matches the [n] citation markers
      chunkId: chunk.id,
      chunkIndex: chunk.chunkIndex,
      similarity: chunk.similarity,
      content: chunk.content,
    })),
    provider: llmResult.provider,
    model: llmResult.model,
  };
}
