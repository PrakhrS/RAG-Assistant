import { generateAnswer } from '../services/answer.service.js';
import ApiError from '../utils/ApiError.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function ask(req, res) {
  const { documentId, question } = req.body;

  if (!documentId) {
    throw new ApiError(400, 'documentId is required');
  }
  if (!UUID_REGEX.test(documentId)) {
    throw new ApiError(400, 'Invalid documentId format. Must be a valid UUID');
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new ApiError(400, 'question is required');
  }

  if (question.length > 1000) {
    throw new ApiError(400, 'question must be 1000 characters or fewer');
  }

  const result = await generateAnswer(documentId, question.trim());

  res.status(200).json({ data: result });
}
