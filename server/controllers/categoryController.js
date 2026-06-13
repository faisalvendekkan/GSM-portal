const categoryModel = require("../models/categoryModel");

async function listCategories(req, res, next) {
  try {
    res.json({ categories: await categoryModel.listCategories(req.query.search || "") });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCategories
};
