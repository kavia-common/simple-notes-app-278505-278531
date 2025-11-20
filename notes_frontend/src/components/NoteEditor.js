import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { sanitizeNoteInput, validateNote } from '../utils/validation';

/**
 * NoteEditor
 * - Edits selected note
 * - Shows validation messages
 * - Supports save and delete with disabled/busy states
 */

// PUBLIC_INTERFACE
export default function NoteEditor({ note, onSave, onDelete, disabled }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setErrors({});
    // autofocus on note change
    if (titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = sanitizeNoteInput({ title, content });
    const { valid, errors: vErr } = validateNote(payload);
    if (!valid) {
      setErrors(vErr);
      return;
    }
    setErrors({});
    setSaving(true);
    await onSave(payload);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (disabled || deleting) return;
    const ok = window.confirm('Delete this note? This action cannot be undone.');
    if (!ok) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <div className="card" aria-live="polite">
      <form className="editor-form" onSubmit={handleSave} noValidate>
        <div className="field">
          <label htmlFor="title" className="label">Title</label>
          <input
            id="title"
            ref={titleRef}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled || saving || deleting}
            maxLength={200}
            required
          />
          {errors.title ? <div className="error-text" role="alert">{errors.title}</div> : <div className="help">Max 200 characters</div>}
        </div>

        <div className="field">
          <label htmlFor="content" className="label">Content</label>
          <textarea
            id="content"
            className="input textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={disabled || saving || deleting}
            maxLength={10000}
          />
          {errors.content ? <div className="error-text" role="alert">{errors.content}</div> : <div className="help">Up to 10,000 characters</div>}
        </div>

        <div className="row">
          <button
            type="submit"
            className="btn primary"
            disabled={disabled || saving || deleting}
            aria-busy={saving ? 'true' : 'false'}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <div className="grow" />
          <button
            type="button"
            className="btn"
            onClick={handleDelete}
            disabled={disabled || saving || deleting}
            aria-busy={deleting ? 'true' : 'false'}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </form>
    </div>
  );
}

NoteEditor.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.any,
    title: PropTypes.string,
    content: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
