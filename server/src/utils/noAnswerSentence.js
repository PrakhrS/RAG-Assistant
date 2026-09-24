// Single source of truth for the "no relevant information" reply.
// promptBuilder.js imports this for the LLM instruction.
// answer.service.js uses it for the short-circuit and to normalize LLM parrots.
export const NO_ANSWER_SENTENCE =
  "I couldn't find relevant information in the document to answer this question.";
