import { useReducer, useCallback, useEffect, useRef } from 'react';
import { askQuestion } from '../api/answer.api.js';

const initialState = {
  entries: [],
  isPending: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ASK_START':
      return {
        ...state,
        isPending: true,
        entries: [...state.entries, action.payload],
      };
    case 'ASK_SUCCESS':
      return {
        ...state,
        isPending: false,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id
            ? { ...entry, status: 'success', result: action.payload.result }
            : entry
        ),
      };
    case 'ASK_ERROR':
      return {
        ...state,
        isPending: false,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id
            ? { ...entry, status: 'error', error: action.payload.error }
            : entry
        ),
      };
    default:
      return state;
  }
}

export function useChat(documentId) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortControllerRef = useRef(null);

  const submit = useCallback(
    async (question) => {
      const trimmed = question.trim();
      if (!trimmed || state.isPending) return;

      const id = crypto.randomUUID();
      dispatch({
        type: 'ASK_START',
        payload: { id, question: trimmed, status: 'pending' },
      });

      abortControllerRef.current = new AbortController();

      try {
        const result = await askQuestion(documentId, trimmed, abortControllerRef.current.signal);
        dispatch({
          type: 'ASK_SUCCESS',
          payload: { id, result },
        });
      } catch (err) {
        // Treat abort as network style error in UI
        dispatch({
          type: 'ASK_ERROR',
          payload: { id, error: err },
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [documentId, state.isPending]
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { ...state, submit };
}
