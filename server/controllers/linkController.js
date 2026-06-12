const linkModel = require("../models/linkModel");

async function listLinks(req, res, next) {
  try {
    const links = await linkModel.listLinks(req.user.id, req.query);
    res.json({ links });
  } catch (error) {
    next(error);
  }
}

async function getLink(req, res, next) {
  try {
    const link = await linkModel.getLink(req.user.id, req.params.id);
    if (!link) return res.status(404).json({ message: "Link not found." });
    res.json({ link });
  } catch (error) {
    next(error);
  }
}

async function createLink(req, res, next) {
  try {
    const link = await linkModel.createLink(req.user.id, req.body);
    res.status(201).json({ link });
  } catch (error) {
    next(error);
  }
}

async function updateLink(req, res, next) {
  try {
    const existing = await linkModel.getLink(req.user.id, req.params.id);
    if (!existing) return res.status(404).json({ message: "Link not found." });
    const link = await linkModel.updateLink(req.user.id, req.params.id, req.body);
    res.json({ link });
  } catch (error) {
    next(error);
  }
}

async function deleteLink(req, res, next) {
  try {
    await linkModel.deleteLink(req.user.id, req.params.id);
    res.json({ message: "Link deleted." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listLinks,
  getLink,
  createLink,
  updateLink,
  deleteLink
};
