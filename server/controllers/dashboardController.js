const articleModel = require("../models/articleModel");
const categoryModel = require("../models/categoryModel");
const chatModel = require("../models/chatModel");
const linkModel = require("../models/linkModel");
const noteModel = require("../models/noteModel");

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const [notesCount, linksCount, chatsCount, articlesCount, recentNotes, recentLinks, latestArticles, categories] =
      await Promise.all([
        noteModel.countNotes(userId),
        linkModel.countLinks(userId),
        chatModel.countChats(userId),
        articleModel.countArticles(),
        noteModel.recentNotes(userId, 4),
        linkModel.recentLinks(userId, 4),
        articleModel.listArticles({ limit: 4 }),
        categoryModel.listCategories()
      ]);

    res.json({
      stats: {
        notes: notesCount,
        savedLinks: linksCount,
        aiChats: chatsCount,
        articles: articlesCount
      },
      recentNotes,
      recentLinks,
      latestArticles,
      categories
    });
  } catch (error) {
    next(error);
  }
}

async function globalSearch(req, res, next) {
  try {
    const q = req.query.q || "";
    if (!q) return res.json({ notes: [], links: [], articles: [], categories: [] });
    const [notes, links, articles, categories] = await Promise.all([
      noteModel.listNotes(req.user.id, { search: q }),
      linkModel.listLinks(req.user.id, { search: q }),
      articleModel.listArticles({ search: q }),
      categoryModel.listCategories(q)
    ]);
    res.json({
      notes: notes.slice(0, 6),
      links: links.slice(0, 6),
      articles: articles.slice(0, 6),
      categories: categories.slice(0, 6)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  globalSearch
};
