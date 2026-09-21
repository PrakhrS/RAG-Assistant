import ApiError from '../utils/ApiError.js';

// --- Error Classification Logic ---

/**
 * Classify a fetch/HTTP error from an LLM provider into our standard categories.
 * @param {Error|Response} error - The caught error or non-2xx Response object
 * @param {Object} [geminiErrorData] - Parsed JSON body from Gemini if available
 */
function classifyError(error, geminiErrorData = null) {
  if (error instanceof TypeError) {
    return 'network'; // Fetch failed to reach the server (DNS, connection refused)
  }
  if (error.name === 'AbortError') {
    return 'timeout';
  }
  
  if (error instanceof Response) {
    const status = error.status;
    
    // Auth failures
    if (status === 401 || status === 403) return 'auth_failure';
    if (status === 400 && geminiErrorData) {
      // Gemini can return 400 with API_KEY_INVALID in the details array
      const isInvalidKey = geminiErrorData?.error?.details?.some(
        d => d.reason === 'API_KEY_INVALID'
      );
      if (isInvalidKey) return 'auth_failure';
    }
    
    if (status === 404) return 'config_error';
    if (status === 429 || status >= 500) return 'retryable';
    if (status === 400) return 'bad_request'; // Assumes our request is malformed
    
    return 'default_unlisted'; // Any other unexpected status
  }

  return 'default_unlisted';
}

/**
 * Translates our internal classification into the correct action:
 * throw ApiError or return for fallback handling.
 */
function handleClassifiedError(provider, classification, rawErrorOrResponse) {
  const detail = rawErrorOrResponse instanceof Response 
    ? `HTTP ${rawErrorOrResponse.status}` 
    : rawErrorOrResponse.message;

  if (classification === 'bad_request' || classification === 'content_blocked') {
    // Non-retryable user/prompt issues
    const msg = classification === 'content_blocked' 
      ? 'LLM response blocked by content policy'
      : `LLM request rejected: ${detail}`;
    throw new ApiError(502, msg);
  }

  // Auth or config errors require an error-level log but allow fallback to keep the app up
  if (classification === 'auth_failure' || classification === 'config_error') {
    console.error(`[LLM Error] ${provider} configuration or auth failed (reason: ${classification}, detail: ${detail}). Check your API keys and model IDs.`);
  } else if (classification === 'default_unlisted') {
    console.warn(`[LLM Warning] ${provider} failed with unexpected status (reason: ${classification}, detail: ${detail}).`);
  }

  // For retryable, auth_failure, config_error, timeout, network, default_unlisted -> fall back
  return { provider, failed: true, classification, detail };
}

// --- Adapters ---

async function geminiAdapter(prompt, config) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
  
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
          thinkingConfig: { thinkingLevel: 'low' }
        }
      }),
      signal: controller.signal
    });
    
    if (!res.ok) {
      let errorData = null;
      try { errorData = await res.json(); } catch (e) {}
      const classification = classifyError(res, errorData);
      return handleClassifiedError('Gemini', classification, res);
    }
    
    const data = await res.json();
    const candidate = data.candidates?.[0];
    const finishReason = candidate?.finishReason;
    
    // Safety check
    if (!candidate || finishReason === 'SAFETY' || data.promptFeedback?.blockReason) {
      return handleClassifiedError('Gemini', 'content_blocked', new Error('Safety block'));
    }
    
    const text = candidate.content?.parts?.[0]?.text || '';
    
    if (finishReason === 'MAX_TOKENS') {
      if (!text) {
        return handleClassifiedError('Gemini', 'truncated', new Error('Empty truncated response'));
      }
      return { text, provider: 'gemini', model, truncated: true };
    }
    
    return { text, provider: 'gemini', model, truncated: false };
    
  } catch (err) {
    if (err instanceof ApiError) throw err; // Re-throw 502s
    const classification = classifyError(err);
    return handleClassifiedError('Gemini', classification, err);
  } finally {
    clearTimeout(timer);
  }
}

async function groqAdapter(prompt, config) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing');
  
  const model = process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const reasoningParams = model.toLowerCase().includes('qwen') 
    ? { reasoning_effort: 'none', reasoning_format: 'hidden' } 
    : {};
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_completion_tokens: config.maxOutputTokens,
        ...reasoningParams
      }),
      signal: controller.signal
    });
    
    if (!res.ok) {
      const classification = classifyError(res);
      return handleClassifiedError('Groq', classification, res);
    }
    
    const data = await res.json();
    const choice = data.choices?.[0];
    const finishReason = choice?.finish_reason;
    
    if (!choice || finishReason === 'content_filter') {
      return handleClassifiedError('Groq', 'content_blocked', new Error('Content filter'));
    }
    
    const text = choice.message?.content || '';
    
    if (finishReason === 'length') {
      if (!text) {
        return handleClassifiedError('Groq', 'truncated', new Error('Empty truncated response'));
      }
      return { text, provider: 'groq', model, truncated: true };
    }
    
    return { text, provider: 'groq', model, truncated: false };
    
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const classification = classifyError(err);
    return handleClassifiedError('Groq', classification, err);
  } finally {
    clearTimeout(timer);
  }
}

// --- Main Service Export ---

/**
 * Generates an answer using the primary LLM (Gemini), falling back to Groq if needed.
 * @param {string} prompt 
 */
export async function generate(prompt) {
  const rawTemp = parseFloat(process.env.LLM_TEMPERATURE);
  const rawMax = parseInt(process.env.LLM_MAX_OUTPUT_TOKENS, 10);
  const rawTimeout = parseInt(process.env.LLM_TIMEOUT_MS, 10);

  const config = {
    temperature: isNaN(rawTemp) ? 0.2 : rawTemp,
    maxOutputTokens: isNaN(rawMax) ? 1024 : rawMax,
    timeoutMs: isNaN(rawTimeout) ? 15000 : rawTimeout,
  };

  // 1. Try Primary (Gemini)
  const startTime = Date.now();
  const primaryResult = await geminiAdapter(prompt, config);
  
  if (!primaryResult.failed) {
    console.log(`[LLM] Response from ${primaryResult.provider}/${primaryResult.model} in ${Date.now() - startTime}ms`);
    return primaryResult;
  }

  // Log primary failure
  console.log(`[LLM Fallback] Gemini failed (reason: ${primaryResult.classification}, detail: ${primaryResult.detail})`);

  // 2. Try Fallback (Groq)
  const fallbackStartTime = Date.now();
  const fallbackResult = await groqAdapter(prompt, config);
  
  if (!fallbackResult.failed) {
    console.log(`[LLM] Response from ${fallbackResult.provider}/${fallbackResult.model} in ${Date.now() - fallbackStartTime}ms`);
    return fallbackResult;
  }

  // Log fallback failure
  console.log(`[LLM Fallback] Groq also failed (reason: ${fallbackResult.classification}, detail: ${fallbackResult.detail})`);
  
  // Both failed
  throw new ApiError(503, 'All LLM providers are currently unavailable');
}
