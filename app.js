// Notes app — vanilla JS, two-column layout, auto-saving to localStorage.

const STORAGE_KEY = "notes-app:notes";

// ---- State ------------------------------------------------------------
let notes = [];          // array of { id, title, body, updatedAt }
let selectedId = null;   // id of the note open in the editor, or null
let creating = false;    // true when a blank new-note draft is open (not yet saved)

// ---- Element references -----------------------------------------------
const app = document.getElementById("app");
const newNoteBtn = document.getElementById("new-note-btn");
const notesList = document.getElementById("notes-list");
const emptyState = document.getElementById("empty-state");
const editor = document.getElementById("editor");
const backBtn = document.getElementById("back-btn");
const statusEl = document.getElementById("editor-status");
const deleteBtn = document.getElementById("delete-btn");
const titleInput = document.getElementById("note-title");
const bodyInput = document.getElementById("note-body");

// ---- Helpers ----------------------------------------------------------
function isBlank(str) {
  return !str || str.trim() === "";
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Newest-edited first, without mutating storage order.
function sortedNotes() {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---- Storage ----------------------------------------------------------
function loadNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything that ended up completely empty (e.g. tab closed mid-edit).
    return parsed.filter((n) => !isBlank(n.title) || !isBlank(n.body));
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ---- Showing the editor vs. the empty state ---------------------------
function showEditor() {
  emptyState.hidden = true;
  editor.hidden = false;
  app.classList.add("is-editing"); // drives the mobile master-detail view
}

function showEmpty() {
  editor.hidden = true;
  emptyState.hidden = false;
  app.classList.remove("is-editing");
}

// ---- Opening notes ----------------------------------------------------
function openNew() {
  leaveCurrent();
  creating = true;
  selectedId = null;
  titleInput.value = "";
  bodyInput.value = "";
  deleteBtn.hidden = true; // nothing to delete until the draft has content
  statusEl.textContent = "";
  showEditor();
  renderSidebar();
  titleInput.focus();
}

function openNote(id) {
  if (id === selectedId) {
    showEditor(); // already open — on mobile this re-reveals the editor
    return;
  }
  leaveCurrent();

  const note = notes.find((n) => n.id === id);
  if (!note) return;

  creating = false;
  selectedId = id;
  titleInput.value = note.title;
  bodyInput.value = note.body;
  deleteBtn.hidden = false;
  statusEl.textContent = "Saved";
  showEditor();
  renderSidebar();
}

// If the note we're leaving is completely empty, discard it.
function leaveCurrent() {
  if (selectedId !== null) {
    const note = notes.find((n) => n.id === selectedId);
    if (note && isBlank(note.title) && isBlank(note.body)) {
      notes = notes.filter((n) => n.id !== selectedId);
      saveNotes();
    }
  }
  selectedId = null;
  creating = false;
}

// ---- Auto-save --------------------------------------------------------
function handleInput() {
  const title = titleInput.value;
  const body = bodyInput.value;

  if (creating) {
    // Don't persist a brand-new note until there's actually something in it.
    if (isBlank(title) && isBlank(body)) return;

    const note = { id: createId(), title, body, updatedAt: Date.now() };
    notes.push(note);
    selectedId = note.id;
    creating = false;
    deleteBtn.hidden = false;
  } else if (selectedId !== null) {
    const note = notes.find((n) => n.id === selectedId);
    if (!note) return;
    note.title = title;
    note.body = body;
    note.updatedAt = Date.now();
  } else {
    return;
  }

  saveNotes();
  statusEl.textContent = "Saved";
  renderSidebar();
}

// ---- Delete / back ----------------------------------------------------
function deleteCurrent() {
  if (selectedId === null) return;

  const note = notes.find((n) => n.id === selectedId);
  const label = note && !isBlank(note.title) ? `"${note.title.trim()}"` : "this note";
  if (!confirm(`Delete ${label}? This can't be undone.`)) return;

  notes = notes.filter((n) => n.id !== selectedId);
  saveNotes();
  selectedId = null;
  creating = false;
  showEmpty();
  renderSidebar();
}

function goBack() {
  leaveCurrent();
  showEmpty();
  renderSidebar();
}

// ---- Rendering --------------------------------------------------------
function render() {
  renderSidebar();
  showEmpty();
}

function renderSidebar() {
  notesList.innerHTML = "";
  sortedNotes().forEach((note) => notesList.appendChild(buildItem(note)));
}

function buildItem(note) {
  const li = document.createElement("li");
  li.className = "note-item";
  if (note.id === selectedId) li.classList.add("selected");
  li.tabIndex = 0;

  const title = document.createElement("div");
  title.className = "note-item-title";
  if (isBlank(note.title)) {
    title.textContent = "Untitled";
    title.classList.add("untitled");
  } else {
    title.textContent = note.title.trim();
  }
  li.appendChild(title);

  const preview = document.createElement("div");
  preview.className = "note-item-preview";
  preview.textContent = isBlank(note.body) ? "No additional text" : note.body.trim();
  li.appendChild(preview);

  const date = document.createElement("div");
  date.className = "note-item-date";
  date.textContent = formatDate(note.updatedAt);
  li.appendChild(date);

  li.addEventListener("click", () => openNote(note.id));
  li.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openNote(note.id);
    }
  });

  return li;
}

// ---- Wiring -----------------------------------------------------------
newNoteBtn.addEventListener("click", openNew);
deleteBtn.addEventListener("click", deleteCurrent);
backBtn.addEventListener("click", goBack);
titleInput.addEventListener("input", handleInput);
bodyInput.addEventListener("input", handleInput);

// ---- Startup ----------------------------------------------------------
notes = loadNotes();
render();
