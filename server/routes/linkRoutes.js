const express = require("express");
const { body, param } = require("express-validator");
const linkController = require("../controllers/linkController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/security");

const router = express.Router();

const linkRules = [
  body("title").isLength({ min: 2, max: 160 }).withMessage("Title must be 2 to 160 characters."),
  body("url").isURL({ require_protocol: true }).withMessage("Enter a full URL including https://"),
  body("categoryId").optional({ nullable: true, checkFalsy: true }).isInt().withMessage("Category must be valid."),
  body("description").optional({ nullable: true, checkFalsy: true }).isLength({ max: 1000 }).withMessage("Description is too long.")
];

router.use(authenticate, authorize("student", "admin"));
router.get("/", linkController.listLinks);
router.get("/:id", param("id").isInt(), validate, linkController.getLink);
router.post("/", linkRules, validate, linkController.createLink);
router.put("/:id", param("id").isInt(), linkRules, validate, linkController.updateLink);
router.delete("/:id", param("id").isInt(), validate, linkController.deleteLink);

module.exports = router;
