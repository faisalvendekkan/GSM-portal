const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter, validate } = require("../middleware/security");

const router = express.Router();

const emailPasswordRules = [
  body("email").isEmail().withMessage("Use a valid email address.").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required.")
];

router.post(
  "/register",
  authLimiter,
  [
    body("name").isLength({ min: 2, max: 80 }).withMessage("Name must be 2 to 80 characters."),
    body("email").isEmail().withMessage("Use a valid email address.").normalizeEmail(),
    body("password")
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage("Use at least 8 characters with uppercase, lowercase, number, and symbol."),
    body("confirmPassword").custom((value, { req }) => value === req.body.password).withMessage("Passwords must match.")
  ],
  validate,
  authController.register
);

router.post("/login", authLimiter, emailPasswordRules, validate, authController.login);
router.post("/admin/login", authLimiter, emailPasswordRules, validate, authController.adminLogin);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);
router.put(
  "/profile",
  authenticate,
  [
    body("name").isLength({ min: 2, max: 80 }).withMessage("Name must be 2 to 80 characters."),
    body("phone").optional({ nullable: true, checkFalsy: true }).isLength({ max: 30 }).withMessage("Phone is too long."),
    body("bio").optional({ nullable: true, checkFalsy: true }).isLength({ max: 500 }).withMessage("Bio is too long.")
  ],
  validate,
  authController.updateProfile
);

module.exports = router;
