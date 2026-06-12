const express = require("express");
const { body } = require("express-validator");
const aiController = require("../controllers/aiController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/security");

const router = express.Router();

router.use(authenticate, authorize("student", "admin"));
router.get("/history", aiController.getHistory);
router.post(
  "/chat",
  [body("question").isLength({ min: 3, max: 2000 }).withMessage("Ask a repair question between 3 and 2000 characters.")],
  validate,
  aiController.chat
);

module.exports = router;
