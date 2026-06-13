const express = require("express");
const categoryController = require("../controllers/categoryController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("student", "admin"));
router.get("/", categoryController.listCategories);

module.exports = router;
