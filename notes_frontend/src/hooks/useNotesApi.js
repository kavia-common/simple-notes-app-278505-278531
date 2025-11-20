import { useCallback, useRef, useState } from 'react';
import { apiRequest } from '../api/client';
import { sanitizeNoteInput, validateNote } from '../utils/validation';

/**
 * Hook exposing listNotes, getNote, createNote, updateNote, deleteNote with
 * input sanitization, validation, and structured responses.
 */

// PUBLIC_INTERFACE
export function useNotesApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(0);

  const withLoading = useCallback(async (fn) => {
    inFlight.current += 1;
    setLoading(true);
    try {
      const res = await fn();
      if (!res.ok) setError(res.error || 'Unknown error');
      return res;
    } finally {
      inFlight.current -= 1;
      if (inFlight.current <= 0) {
        inFlight.current = 0;
        setLoading(false);
      }
    }
  }, []);

  // PUBLIC_INTERFACE
  const clearError = useCallback(() => setError(null), []);

  // PUBLIC_INTERFACE
  const listNotes = useCallback(async () => {
    return withLoading(async () => {
      const res = await apiRequest('/notes', { method: 'GET' });
      if (!res.ok) return res;
      // Expect array of notes
      const data = Array.isArray(res.data) ? res.data : [];
      return { ok: true, status: res.status, error: null, data };
    });
  }, [withLoading]);

  // PUBLIC_INTERFACE
  const getNote = useCallback(async (id) => {
    const safeId = encodeURIComponent(String(id));
    return withLoading(async () => {
      const res = await apiRequest(`/notes/${safeId}`, { method: 'GET' });
      return res;
    });
  }, [withLoading]);

  // PUBLIC_INTERFACE
  const createNote = useCallback(async ({ title, content }) => {
    const payload = sanitizeNoteInput({ title, content });
    const { valid, errors } = validateNote(payload);
    if (!valid) {
      return { ok: false, status: 400, error: errors.title || errors.content || 'Validation failed', data: null };
    }
    return withLoading(async () => {
      const res = await apiRequest('/notes', { method: 'POST', body: payload });
      return res;
    });
  }, [withLoading]);

  // PUBLIC_INTERFACE
  const updateNote = useCallback(async (id, { title, content }) => {
    const payload = sanitizeNoteInput({ title, content });
    const { valid, errors } = validateNote(payload);
    if (!valid) {
      return { ok: false, status: 400, error: errors.title || errors.content || 'Validation failed', data: null };
    }
    const safeId = encodeURIComponent(String(id));
    return withLoading(async () => {
      const res = await apiRequest(`/notes/${safeId}`, { method: 'PUT', body: payload });
      return res;
    });
  }, [withLoading]);

  // PUBLIC_INTERFACE
  const deleteNote = useCallback(async (id) => {
    const safeId = encodeURIComponent(String(id));
    return withLoading(async () => {
      const res = await apiRequest(`/notes/${safeId}`, { method: 'DELETE' });
      return res;
    });
  }, [withLoading]);

  return {
    listNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    loading,
    error,
    clearError,
  };
}
