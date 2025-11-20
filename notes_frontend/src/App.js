import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';
import TopNav from './components/TopNav';
import NotesSidebar from './components/NotesSidebar';
import NoteEditor from './components/NoteEditor';
import { useNotesApi } from './hooks/useNotesApi';

// PUBLIC_INTERFACE
function App() {
  /**
   * Main application component coordinating sidebar and editor with CRUD flows.
   * - Manages list of notes, selected note id, and selected note data
   * - Handles optimistic create/update/delete where safe
   * - Displays loading and error states
   * - Manages keyboard focus for accessibility
   */
  const {
    listNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    loading: apiLoading,
    error: apiError,
    clearError,
  } = useNotesApi();

  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [filter, setFilter] = useState('');
  const sidebarListRef = useRef(null);

  // Load notes list on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setListLoading(true);
      setListError(null);
      const res = await listNotes();
      if (!mounted) return;
      if (res.ok) {
        setNotes(res.data || []);
        // If nothing selected, select first note if any
        if (!selectedNoteId && res.data && res.data.length > 0) {
          setSelectedNoteId(res.data[0].id);
        }
      } else {
        setListError(res.error || 'Failed to load notes');
      }
      setListLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [listNotes]); // only on mount and when listNotes reference changes

  // Load selected note when id changes
  useEffect(() => {
    let mounted = true;
    if (!selectedNoteId) {
      setSelectedNote(null);
      return () => {
        mounted = false;
      };
    }
    (async () => {
      setBusy(true);
      const res = await getNote(selectedNoteId);
      if (!mounted) return;
      if (res.ok) {
        setSelectedNote(res.data);
      } else {
        setSelectedNote(null);
      }
      setBusy(false);
    })();
    return () => {
      mounted = false;
    };
  }, [selectedNoteId, getNote]);

  const filteredNotes = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => (n.title || '').toLowerCase().includes(q));
  }, [filter, notes]);

  const handleSelectNote = useCallback((id) => {
    setSelectedNoteId(id);
    // Move focus to editor title after selection (handled in NoteEditor via autoFocus when selectedNote changes)
  }, []);

  const handleAddNote = useCallback(async () => {
    setBusy(true);
    // Optimistic: Temporarily add a placeholder note
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, title: 'Untitled note', content: '' };
    setNotes((prev) => [optimistic, ...prev]);
    setSelectedNoteId(tempId);
    setSelectedNote(optimistic);
    const res = await createNote({ title: optimistic.title, content: optimistic.content });
    if (res.ok && res.data) {
      // Replace temp with actual
      setNotes((prev) => {
        const withoutTemp = prev.filter((n) => n.id !== tempId);
        return [res.data, ...withoutTemp];
      });
      setSelectedNoteId(res.data.id);
      setSelectedNote(res.data);
      // Focus sidebar on new item
      if (sidebarListRef.current) {
        try {
          const el = sidebarListRef.current.querySelector(`[data-note-id="${res.data.id}"]`);
          if (el) el.focus();
        } catch {
          // no-op safe guard
        }
      }
    } else {
      // Rollback optimistic on error
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
    }
    setBusy(false);
  }, [createNote]);

  const handleSaveNote = useCallback(
    async (payload) => {
      if (!selectedNoteId) return;
      setBusy(true);
      const res = await updateNote(selectedNoteId, payload);
      if (res.ok && res.data) {
        setSelectedNote(res.data);
        setNotes((prev) => prev.map((n) => (n.id === selectedNoteId ? res.data : n)));
      }
      setBusy(false);
    },
    [selectedNoteId, updateNote]
  );

  const handleDeleteNote = useCallback(async () => {
    if (!selectedNoteId) return;
    const toDelete = selectedNoteId;
    setBusy(true);
    // Optimistic: remove from list immediately
    setNotes((prev) => prev.filter((n) => n.id !== toDelete));
    setSelectedNoteId(null);
    setSelectedNote(null);
    const res = await deleteNote(toDelete);
    if (!res.ok) {
      // On error: reload list to recover
      const listRes = await listNotes();
      if (listRes.ok) setNotes(listRes.data || []);
    }
    setBusy(false);
  }, [selectedNoteId, deleteNote, listNotes]);

  const appError = apiError || listError;
  const clearAppError = useCallback(() => {
    clearError();
    setListError(null);
  }, [clearError]);

  return (
    <div className="app-root">
      <TopNav title="Notes" />
      <div className="layout">
        <aside className="sidebar" aria-label="Notes list">
          <NotesSidebar
            notes={filteredNotes}
            selectedId={selectedNoteId}
            onSelect={handleSelectNote}
            onAdd={handleAddNote}
            filter={filter}
            onFilterChange={setFilter}
            busy={busy || listLoading || apiLoading}
            listRef={sidebarListRef}
          />
        </aside>
        <main className="main">
          {listLoading ? (
            <div className="state info" role="status" aria-live="polite">
              Loading notes…
            </div>
          ) : appError ? (
            <div className="state error" role="alert">
              <div>{String(appError)}</div>
              <button className="btn" onClick={clearAppError} type="button">
                Dismiss
              </button>
            </div>
          ) : selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onSave={handleSaveNote}
              onDelete={handleDeleteNote}
              disabled={busy || apiLoading}
            />
          ) : notes.length === 0 ? (
            <div className="state empty">
              <p>No notes yet.</p>
              <button className="btn primary" onClick={handleAddNote} type="button" disabled={busy || apiLoading}>
                Add your first note
              </button>
            </div>
          ) : (
            <div className="state info" role="status" aria-live="polite">
              Select a note from the list or create a new one.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
