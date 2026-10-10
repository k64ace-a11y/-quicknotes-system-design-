const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusMessage = document.getElementById("status");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const notesList = document.getElementById("notes-list");

let displayedNotes = [];

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status";
  if (type) statusMessage.classList.add(type);
}

function setLoading(button, isLoading, loadingText, normalText) {
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : normalText;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = new Error(`The server returned status ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  // DELETE responses can be empty (204); avoid trying to parse an empty body.
  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const data = await response.json();
  return { data, status: response.status };
}

function createNoteElement(note) {
  const item = document.createElement("li");
  item.className = "note-card";

  const title = document.createElement("h3");
  title.textContent = note.title || "(Untitled note)";

  const body = document.createElement("p");
  body.textContent = note.body || "No body was provided.";

  const meta = document.createElement("div");
  meta.className = "note-meta";
  meta.textContent = `Note ID: ${note.id}`;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteNote(note.id, item, deleteButton));

  item.append(title, body, meta, deleteButton);
  return item;
}

function renderNotes(notes) {
  notesList.replaceChildren();

  if (!notes.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "note-card";
    emptyItem.textContent = "No notes to show yet. Load notes or create your first note.";
    notesList.appendChild(emptyItem);
    return;
  }

  const fragment = document.createDocumentFragment();
  notes.forEach(note => fragment.appendChild(createNoteElement(note)));
  notesList.appendChild(fragment);
}

function getFriendlyError(error) {
  if (error instanceof TypeError) {
    return "We could not reach the server. Check your internet connection and try again.";
  }
  if (error.status) {
    return `The request failed (status ${error.status}). Please try again.`;
  }
  return "Something went wrong. Please try again.";
}

async function loadNotes() {
  setLoading(loadButton, true, "Loading...", "Load notes");
  showStatus("Loading notes...", "loading");

  try {
    const result = await request(`${API_URL}?_limit=10`);
    displayedNotes = Array.isArray(result.data) ? result.data : [];
    renderNotes(displayedNotes);

    if (displayedNotes.length === 0) {
      showStatus("The server returned no notes.", "success");
    } else {
      showStatus(`Loaded ${displayedNotes.length} notes from the server.`, "success");
    }
  } catch (error) {
    showStatus(getFriendlyError(error), "error");
  } finally {
    setLoading(loadButton, false, "Loading...", "Load notes");
  }
}

async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    titleInput.setCustomValidity("Please enter a title.");
    titleInput.reportValidity();
    titleInput.setCustomValidity("");
    showStatus("A title is required.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    showStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  setLoading(submitButton, true, "Creating...", "Create note");
  showStatus("Creating your note...", "loading");

  try {
    const result = await request(API_URL, {
      method: "POST",
      body: JSON.stringify({ title, body, userId: 1 })
    });

    const createdNote = result.data;
    displayedNotes = [createdNote, ...displayedNotes];
    renderNotes(displayedNotes);
    noteForm.reset();
    showStatus(`Note created (status ${result.status}, id ${createdNote.id}).`, "success");
  } catch (error) {
    showStatus(getFriendlyError(error), "error");
  } finally {
    setLoading(submitButton, false, "Creating...", "Create note");
  }
}

async function deleteNote(id, noteElement, button) {
  const originalText = button.textContent;
  setLoading(button, true, "Deleting...", originalText);
  showStatus(`Deleting note ${id}...`, "loading");

  try {
    await request(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
    displayedNotes = displayedNotes.filter(note => String(note.id) !== String(id));
    // JSONPlaceholder simulates DELETE and does not persist changes. We remove the
    // note from this page's local list after a successful response for a clear demo.
    noteElement.remove();

    if (displayedNotes.length === 0) {
      renderNotes([]);
    }
    showStatus(`Note ${id} deleted from this page. The practice API does not permanently save changes.`, "success");
  } catch (error) {
    showStatus(getFriendlyError(error), "error");
    setLoading(button, false, "Deleting...", originalText);
  } finally {
    // On success the note element is removed; on failure the button is re-enabled above.
    if (noteElement.isConnected) {
      setLoading(button, false, "Deleting...", originalText);
    }
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
