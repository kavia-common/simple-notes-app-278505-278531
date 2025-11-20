import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * NotesSidebar
 * - Shows a searchable list of notes
 * - Accessible list with buttons and aria-current on selected
 * - Add new note button
 */

// PUBLIC_INTERFACE
export default function NotesSidebar({ notes, selectedId, onSelect, onAdd, filter, onFilterChange, busy, listRef }) {
  const internalRef = useRef(null);
  const ref = listRef || internalRef;

  const selectedIndex = useMemo(() => notes.findIndex((n) => n.id === selectedId), [notes, selectedId]);

  useEffect(() => {
    if (!ref.current) return;
    if (selectedIndex >= 0) {
      const el = ref.current.querySelector(`[data-note-id="${notes[selectedIndex].id}"]`);
      if (el) {
        // don't steal focus if user is typing in search
        const active = document.activeElement;
        const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (!isTyping) {
          el.focus();
        }
      }
    }
  }, [selectedIndex, notes, ref]);

  return (
    <div className="sidebar-root" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">
        <div className="search">
          <input
            aria-label="Search notes"
            placeholder="Search notes…"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="input"
            disabled={busy}
          />
          <button type="button" className="btn primary" onClick={onAdd} disabled={busy}>
            + Add
          </button>
        </div>
      </div>
      <div className="notes-list" role="list" aria-label="Notes" ref={ref}>
        {notes.length === 0 ? (
          <div className="help" style={{ padding: '8px 4px' }}>No notes</div>
        ) : (
          notes.map((note) => (
            <button
              key={note.id}
              type="button"
              role="listitem"
              className="note-item"
              aria-current={selectedId === note.id ? 'true' : 'false'}
              onClick={() => onSelect(note.id)}
              data-note-id={note.id}
            >
              <div className="note-title">{note.title || 'Untitled'}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

NotesSidebar.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.any, title: PropTypes.string, content: PropTypes.string })),
  selectedId: PropTypes.any,
  onSelect: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  listRef: PropTypes.any,
};
