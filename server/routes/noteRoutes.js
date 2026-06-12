const express = require("express");
const { body, param } = require("express-validator");
const noteController = require("../controllers/noteController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/security");

const router = express.Router();

const noteRules = [
  body("title").isLength({ min: 2, max: 160 }).withMessage("Title must be 2 to 160 characters."),
  body("categoryId").optional({ nullable: true, checkFalsy: true }).isInt().withMessage("Category must be valid."),
  body("description").isLength({ min: 3, max: 10000 }).withMessage("Description must be 3 to 10000 characters."),
  body("tags").optional({ nullable: true, checkFalsy: true }).custom((value) => Array.isArray(value) || typeof value === "string")
];

router.use(authenticate, authorize("student", "admin"));
router.get("/", noteController.listNotes);
router.get("/:id", param("id").isInt(), validate, noteController.getNote);
router.post("/", noteRules, validate, noteController.createNote);
router.put("/:id", param("id").isInt(), noteRules, validate, noteController.updateNote);
router.delete("/:id", param("id").isInt(), validate, noteController.deleteNote);

module.exports = router;
