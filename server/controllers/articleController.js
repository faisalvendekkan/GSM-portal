const articleModel = require("../models/articleModel");

async function listArticles(req, res, next) {
  try {
    const articles = await articleModel.listArticles(req.query);
    res.json({ articles });
  } catch (error) {
    next(error);
  }
}

async function getArticle(req, res, next) {
  try {
    const article = await articleModel.getArticleBySlug(req.params.slug);
    if (!article) return res.status(404).json({ message: "Article not found." });
    res.json({ article });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listArticles,
  getArticle
};
