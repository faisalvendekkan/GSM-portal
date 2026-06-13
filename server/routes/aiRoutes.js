const express = require("express");
const { body } = require("express-validator");
const multer = require("multer");
const aiController = require("../controllers/aiController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/security");

const router = express.Router();
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, callback) {
    if (allowedImageTypes.has(file.mimetype)) return callback(null, true);
    return callback(new Error("Unsupported image type. Please upload a JPEG, PNG, or WebP photo."));
  }
});

function uploadImage(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Image is too large. Please upload a photo under 8 MB." });
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: "Please upload one valid image file." });
    }
    return res.status(400).json({ message: error.message || "Image upload failed. Please try another photo." });
  });
}

function normalizeQuestion(req, res, next) {
  const raw = req.body?.message ?? req.body?.question ?? "";
  const value = Array.isArray(raw) ? raw[0] : raw;
  req.body.question = String(value || "")
    .trim()
    .replace(/\0/g, "");
  next();
}

router.use(authenticate, authorize("student", "admin"));
router.get("/history", aiController.getHistory);
router.post(
  "/chat",
  uploadImage,
  normalizeQuestion,
  [body("question").isLength({ min: 3, max: 2000 }).withMessage("Ask a repair question between 3 and 2000 characters.")],
  validate,
  aiController.chat
);

module.exports = router;
