const express = require("express");
const { body, param } = require("express-validator");
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/security");
const { normalizeEmail } = require("../utils/normalize");

const router = express.Router();

const categoryRules = [
  body("name").isLength({ min: 2, max: 120 }).withMessage("Category name must be 2 to 120 characters."),
  body("slug").optional({ nullable: true, checkFalsy: true }).matches(/^[a-z0-9-]+$/).withMessage("Slug can use lowercase letters, numbers, and hyphens."),
  body("description").optional({ nullable: true, checkFalsy: true }).isLength({ max: 500 }).withMessage("Description is too long.")
];

const articleRules = [
  body("title").isLength({ min: 3, max: 180 }).withMessage("Title must be 3 to 180 characters."),
  body("slug").optional({ nullable: true, checkFalsy: true }).matches(/^[a-z0-9-]+$/).withMessage("Slug can use lowercase letters, numbers, and hyphens."),
  body("categoryId").optional({ nullable: true, checkFalsy: true }).isInt().withMessage("Category must be valid."),
  body("content").isLength({ min: 10 }).withMessage("Article content is required."),
  body("imageUrl").optional({ nullable: true, checkFalsy: true }).isURL({ require_protocol: true }).withMessage("Image URL must be valid."),
  body("videoUrl").optional({ nullable: true, checkFalsy: true }).isURL({ require_protocol: true }).withMessage("Video URL must be valid."),
  body("tags").optional({ nullable: true, checkFalsy: true }).custom((value) => Array.isArray(value) || typeof value === "string")
];

function normalizeUserPayload(req, res, next) {
  if (!req.body.fullName && req.body.full_name) req.body.fullName = req.body.full_name;
  next();
}

const userRules = [
  body("fullName").isLength({ min: 2, max: 80 }).withMessage("Full name must be 2 to 80 characters."),
  body("email").customSanitizer((value) => normalizeEmail(value)).isEmail().withMessage("Use a valid email address."),
  body("phone").optional({ nullable: true, checkFalsy: true }).isLength({ max: 30 }).withMessage("Phone is too long."),
  body("role").isIn(["admin", "student"]).withMessage("Role must be admin or student."),
  body("status").isIn(["active", "inactive", "suspended"]).withMessage("Status must be active, inactive, or suspended.")
];

const createUserRules = [
  ...userRules,
  body("password")
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    .withMessage("Use at least 8 characters with uppercase, lowercase, number, and symbol."),
  body("confirmPassword").custom((value, { req }) => value === req.body.password).withMessage("Passwords must match.")
];

const resetPasswordRules = [
  body("password")
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    .withMessage("Use at least 8 characters with uppercase, lowercase, number, and symbol."),
  body("confirmPassword").custom((value, { req }) => value === req.body.password).withMessage("Passwords must match.")
];

router.use(authenticate, authorize("admin"));
router.get("/stats", adminController.stats);
router.get("/students", adminController.students);

router.get("/users", adminController.listUsers);
router.get("/users/:id", param("id").isInt(), validate, adminController.getUser);
router.post("/users", normalizeUserPayload, createUserRules, validate, adminController.createUser);
router.put("/users/:id", normalizeUserPayload, param("id").isInt(), userRules, validate, adminController.updateUser);
router.delete("/users/:id", param("id").isInt(), validate, adminController.deleteUser);
router.patch(
  "/users/:id/status",
  param("id").isInt(),
  body("status").isIn(["active", "inactive", "suspended"]).withMessage("Status must be active, inactive, or suspended."),
  validate,
  adminController.changeUserStatus
);
router.patch("/users/:id/reset-password", param("id").isInt(), resetPasswordRules, validate, adminController.resetUserPassword);
router.patch(
  "/users/:id/role",
  param("id").isInt(),
  body("role").isIn(["admin", "student"]).withMessage("Role must be admin or student."),
  validate,
  adminController.changeUserRole
);

router.get("/categories", adminController.listCategories);
router.post("/categories", categoryRules, validate, adminController.createCategory);
router.put("/categories/:id", param("id").isInt(), categoryRules, validate, adminController.updateCategory);
router.delete("/categories/:id", param("id").isInt(), validate, adminController.deleteCategory);

router.get("/articles", adminController.listArticles);
router.post("/articles", articleRules, validate, adminController.createArticle);
router.put("/articles/:id", param("id").isInt(), articleRules, validate, adminController.updateArticle);
router.delete("/articles/:id", param("id").isInt(), validate, adminController.deleteArticle);

module.exports = router;
