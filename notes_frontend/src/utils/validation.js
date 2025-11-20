/**
 * Validation helpers for notes.
 */

const MAX_TITLE = 200;
const MAX_CONTENT = 10000;

// PUBLIC_INTERFACE
export function sanitizeNoteInput({ title = '', content = '' }) {
  /** Trims and normalizes inputs. */
  const t = String(title ?? '').trim();
  const c = String(content ?? '').trim();
  return { title: t, content: c };
}

// PUBLIC_INTERFACE
export function validateNote({ title = '', content = '' }) {
  /** Returns { valid: boolean, errors: {title?:string, content?:string} } */
  const errors = {};
  const t = String(title ?? '');
  const c = String(content ?? '');

  if (t.length === 0) errors.title = 'Title is required.';
  if (t.length > MAX_TITLE) errors.title = `Title must be at most ${MAX_TITLE} characters.`;

  if (c.length > MAX_CONTENT) errors.content = `Content must be at most ${MAX_CONTENT} characters.`;

  return { valid: Object.keys(errors).length === 0, errors };
}
