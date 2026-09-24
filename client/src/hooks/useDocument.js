import { useReducer, useRef, useEffect, useCallback } from 'react';
import { uploadDocument, getDocumentStatus } from '../api/documents.api.js';

const STALL_TIMEOUT_MS = 5 * 60 * 1000;

const initialState = {
  phase: 'idle',
  document: null,
  failedAt: null,
  error: null,
  elapsedMs: 0,
  consecutiveFailures: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return initialState;
    case 'UPLOAD_START':
      return { ...initialState, phase: 'uploading' };
    case 'UPLOAD_SUCCESS':
      return { ...state, phase: 'processing', document: action.payload };
    case 'UPLOAD_ERROR':
      return { ...state, phase: 'failed', failedAt: 'upload', error: action.payload };
    case 'POLL_SUCCESS':
      return {
        ...state,
        document: action.payload.document,
        phase: action.payload.phase, // 'processing' or 'ready'
        failedAt: action.payload.failedAt || null,
        error: action.payload.error || null,
        elapsedMs: action.payload.elapsedMs,
        consecutiveFailures: 0,
      };
    case 'POLL_ERROR':
      return { ...state, consecutiveFailures: state.consecutiveFailures + 1 };
    case 'FATAL_ERROR':
      return { ...state, phase: 'failed', failedAt: 'processing', error: action.payload };
    case 'STALLED':
      return { ...state, phase: 'stalled' };
    case 'CHECK_AGAIN':
      return { ...state, phase: 'processing', elapsedMs: 0, consecutiveFailures: 0 };
    default:
      return state;
  }
}

export function useDocument() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const activeDocumentIdRef = useRef(null);
  const pollStartRef = useRef(null);

  const resetToIdle = useCallback(() => {
    activeDocumentIdRef.current = null;
    pollStartRef.current = null;
    dispatch({ type: 'RESET' });
  }, []);

  const upload = useCallback(async (file) => {
    // Client-side validation is assumed to be handled before calling this,
    // but just in case:
    if (!file) return;

    dispatch({ type: 'UPLOAD_START' });
    try {
      const doc = await uploadDocument(file);
      activeDocumentIdRef.current = doc.id;
      pollStartRef.current = Date.now();
      dispatch({ type: 'UPLOAD_SUCCESS', payload: doc });
    } catch (err) {
      if (err.kind === 'aborted') return;
      dispatch({ type: 'UPLOAD_ERROR', payload: err });
    }
  }, []);

  const checkAgain = useCallback(() => {
    pollStartRef.current = Date.now();
    dispatch({ type: 'CHECK_AGAIN' });
  }, []);

  useEffect(() => {
    if (state.phase !== 'processing' || !activeDocumentIdRef.current) return;

    let timeoutId = null;
    const controller = new AbortController();
    const docId = activeDocumentIdRef.current;

    const poll = async () => {
      if (activeDocumentIdRef.current !== docId) return; // Stale

      const elapsed = Date.now() - pollStartRef.current;
      if (elapsed > STALL_TIMEOUT_MS) {
        dispatch({ type: 'STALLED' });
        return;
      }

      try {
        const doc = await getDocumentStatus(docId, controller.signal);
        if (activeDocumentIdRef.current !== docId) return;

        if (doc.status === 'completed') {
          dispatch({
            type: 'POLL_SUCCESS',
            payload: { document: doc, phase: 'ready', elapsedMs: elapsed },
          });
        } else if (doc.status === 'failed') {
          dispatch({
            type: 'POLL_SUCCESS',
            payload: { document: doc, phase: 'failed', failedAt: 'processing', elapsedMs: elapsed },
          });
        } else {
          dispatch({
            type: 'POLL_SUCCESS',
            payload: { document: doc, phase: 'processing', elapsedMs: elapsed },
          });
          timeoutId = setTimeout(poll, 2000);
        }
      } catch (err) {
        if (activeDocumentIdRef.current !== docId) return;
        if (err.kind === 'aborted') return;

        if (err.status === 404) {
          dispatch({ type: 'FATAL_ERROR', payload: err });
          return;
        }

        dispatch({ type: 'POLL_ERROR' });
        
        // Wait, the state in the effect closure might be stale for consecutiveFailures.
        // It's better to check via dispatch or just let the effect re-run if we want to rely on state.
        // Actually, since state is in dependency array? No, state is not in dependency array to avoid resetting timeout.
        // But the reducer handles consecutiveFailures + 1. We need to know when it hits 3.
        // Instead of managing consecutiveFailures inside the effect, we can rely on a ref, or an effect on state change.
        // Let's use a ref for consecutive failures to avoid effect re-running.
      }
    };

    timeoutId = setTimeout(poll, 2000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    };
  }, [state.phase]); // Only re-run if phase changes to 'processing'

  // Watch for consecutive failures
  useEffect(() => {
    if (state.consecutiveFailures >= 3) {
      dispatch({
        type: 'FATAL_ERROR',
        payload: { kind: 'network', message: 'Failed to check status after multiple attempts.' },
      });
    }
  }, [state.consecutiveFailures]);

  return { ...state, upload, checkAgain, resetToIdle };
}
