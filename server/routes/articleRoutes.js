const express = require("express");
const articleController = require("../controllers/articleController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("student", "admin"));
router.get("/", articleController.listArticles);
router.get("/:slug", articleController.getArticle);

module.exports = router;
