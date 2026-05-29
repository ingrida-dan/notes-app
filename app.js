// Notes app — vanilla JS, data persisted in localStorage.

const STORAGE_KEY = "notes-app:notes";

// ---- State ------------------------------------------------------------
let notes = [];        // array of { id, title, body, updatedAt }
let editingId = null;  // id of the note being edited, or null when creating

// ---- Element references -----------------------------------------------
const newNoteBtn = document.getElementById("new-note-btn");
const editor = document.getElementById("editor");
const titleInput = document.getElementById("note-title");
const bodyInput = document.getElementById("note-body");
const errorMsg = document.getElementById("editor-error");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const emptyState = document.getElementById("empty-state");
const notesList = document.getElementById("notes-list");

// ---- Storage ----------------------------------------------------------
function loadNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt or hand-edited data: start clean rather than crash.
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ---- Helpers ----------------------------------------------------------
function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ---- Editor open / close ----------------------------------------------
function openEditor(note) {
  editingId = note ? note.id : null;
  titleInput.value = note ? note.title : "";
  bodyInput.value = note ? note.body : "";
  saveBtn.textContent = note ? "Update" : "Save";
  errorMsg.hidden = true;
  editor.hidden = false;
  titleInput.focus();
}

function closeEditor() {
  editor.hidden = true;
  editingId = null;
  titleInput.value = "";
  bodyInput.value = "";
  errorMsg.hidden = true;
}

// ---- Create / update / delete -----------------------------------------
function handleSave(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // A note must have at least a title or a body.
  if (title === "" && body === "") {
    errorMsg.hidden = false;
    titleInput.focus();
    return;
  }

  if (editingId === null) {
    notes.unshift({
      id: createId(),
      title,
      body,
      updatedAt: Date.now(),
    });
  } else {
    const note = notes.find((n) => n.id === editingId);
    if (note) {
      note.title = title;
      note.body = body;
      note.updatedAt = Date.now();
    }
  }

  saveNotes();
  closeEditor();
  render();
}

function deleteNote(id) {
  const note = notes.find((n) => n.id === id);
  const label = note && note.title ? `"${note.title}"` : "this note";
  if (!confirm(`Delete ${label}? This can't be undone.`)) return;

  notes = notes.filter((n) => n.id !== id);
  saveNotes();

  // If we were editing the note we just deleted, close the editor.
  if (editingId === id) closeEditor();
  render();
}

// ---- Rendering --------------------------------------------------------
function render() {
  notesList.innerHTML = "";
  emptyState.hidden = notes.length > 0;

  notes.forEach((note) => {
    notesList.appendChild(buildCard(note));
  });
}

function buildCard(note) {
  const card = document.createElement("article");
  card.className = "note-card";

  const title = document.createElement("h2");
  title.className = "note-card-title";
  if (note.title) {
    title.textContent = note.title;
  } else {
    title.textContent = "Untitled";
    title.classList.add("untitled");
  }
  card.appendChild(title);

  if (note.body) {
    const body = document.createElement("p");
    body.className = "note-card-body";
    body.textContent = note.body;
    card.appendChild(body);
  }

  const meta = document.createElement("p");
  meta.className = "note-card-meta";
  meta.textContent = "Updated " + formatDate(note.updatedAt);
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "note-card-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn-text";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => openEditor(note));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn-text danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deleteNote(note.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  card.appendChild(actions);

  return card;
}

// ---- Wiring -----------------------------------------------------------
newNoteBtn.addEventListener("click", () => openEditor(null));
cancelBtn.addEventListener("click", closeEditor);
editor.addEventListener("submit", handleSave);

// ---- Startup ----------------------------------------------------------
notes = loadNotes();
render();
