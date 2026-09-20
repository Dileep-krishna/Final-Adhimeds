// services/notesAPI.js
import SERVERURL from "./serverURL";

// Minimal JSON parser – throws if invalid
async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// GET ALL NOTES (with optional query params)
export const getNotesAPI = async (queryParams = "") => {
  const url = queryParams
    ? `${SERVERURL}/api/notes?${queryParams}`
    : `${SERVERURL}/api/notes`;
  const res = await fetch(url);
  return handleResponse(res);
};

// GET SINGLE NOTE BY ID
export const getNoteByIdAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/notes/${id}`);
  return handleResponse(res);
};

// CREATE NOTE – supports JSON or FormData (for image upload)
export const createNoteAPI = async (noteData) => {
  const isFormData = noteData instanceof FormData;
  const options = {
    method: "POST",
    body: noteData,
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(noteData);
  }
  const res = await fetch(`${SERVERURL}/api/notes`, options);
  return handleResponse(res);
};

// UPDATE NOTE – supports JSON or FormData (for optional image)
export const updateNoteAPI = async (id, noteData) => {
  const isFormData = noteData instanceof FormData;
  const options = {
    method: "PUT",
    body: noteData,
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(noteData);
  }
  const res = await fetch(`${SERVERURL}/api/notes/${id}`, options);
  return handleResponse(res);
};

// DELETE NOTE
export const deleteNoteAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/notes/${id}`, { method: "DELETE" });
  return handleResponse(res);
};