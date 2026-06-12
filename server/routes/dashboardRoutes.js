const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("student", "admin"));
router.get("/search", dashboardController.globalSearch);
router.get("/student", dashboardController.getDashboard);
router.get("/admin", authorize("admin"), dashboardController.getDashboard);
router.get("/", dashboardController.getDashboard);

module.exports = router;
