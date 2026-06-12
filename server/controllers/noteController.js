const noteModel = require("../models/noteModel");

async function listNotes(req, res, next) {
  try {
    const notes = await noteModel.listNotes(req.user.id, req.query);
    res.json({ notes });
  } catch (error) {
    next(error);
  }
}

async function getNote(req, res, next) {
  try {
    const note = await noteModel.getNote(req.user.id, req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found." });
    res.json({ note });
  } catch (error) {
    next(error);
  }
}

async function createNote(req, res, next) {
  try {
    const note = await noteModel.createNote(req.user.id, req.body);
    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
}

async function updateNote(req, res, next) {
  try {
    const existing = await noteModel.getNote(req.user.id, req.params.id);
    if (!existing) return res.status(404).json({ message: "Note not found." });
    const note = await noteModel.updateNote(req.user.id, req.params.id, req.body);
    res.json({ note });
  } catch (error) {
    next(error);
  }
}

async function deleteNote(req, res, next) {
  try {
    await noteModel.deleteNote(req.user.id, req.params.id);
    res.json({ message: "Note deleted." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
};
