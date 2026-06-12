const bcrypt = require("bcrypt");
const auditLogModel = require("../models/auditLogModel");
const articleModel = require("../models/articleModel");
const categoryModel = require("../models/categoryModel");
const chatModel = require("../models/chatModel");
const linkModel = require("../models/linkModel");
const noteModel = require("../models/noteModel");
const userModel = require("../models/userModel");

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function stats(req, res, next) {
  try {
    const [students, notes, links, aiChats, articles, categories] = await Promise.all([
      userModel.countStudents(),
      noteModel.countNotes(),
      linkModel.countLinks(),
      chatModel.countChats(),
      articleModel.countArticles(),
      categoryModel.countCategories()
    ]);
    res.json({ stats: { students, notes, links, aiChats, articles, categories } });
  } catch (error) {
    next(error);
  }
}

async function students(req, res, next) {
  try {
    const data = await userModel.listStudents(req.query.search || "");
    res.json({ students: data });
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const data = await userModel.listUsers(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userModel.getUserDetails(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const auditLogs = await auditLogModel.listForUser(req.params.id);
    res.json({ user, auditLogs });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { fullName, email, phone, password, role, status } = req.body;
    const existing = await userModel.findByEmail(email);
    if (existing) return res.status(409).json({ message: "A user with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.createManagedUser({
      fullName,
      email,
      phone,
      passwordHash,
      role,
      status
    });

    await auditLogModel.createAuditLog({
      adminId: req.user.id,
      action: "user_create",
      targetUserId: user.id,
      details: { email: user.email, role: user.role, status: user.status }
    });

    res.status(201).json({ user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "A user with this email already exists." });
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const existing = await userModel.getUserDetails(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found." });

    if (Number(req.params.id) === Number(req.user.id) && req.body.status !== "active") {
      return res.status(400).json({ message: "You cannot deactivate or suspend your own account." });
    }

    const user = await userModel.updateManagedUser(req.params.id, req.body);
    await auditLogModel.createAuditLog({
      adminId: req.user.id,
      action: "user_update",
      targetUserId: user.id,
      details: {
        before: {
          full_name: existing.full_name,
          email: existing.email,
          phone: existing.phone,
          role: existing.role,
          status: existing.status
        },
        after: {
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
      }
    });

    res.json({ user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "A user with this email already exists." });
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const existing = await userModel.getUserDetails(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found." });

    await userModel.deleteManagedUser(req.params.id);
    await auditLogModel.createAuditLog({
      adminId: req.user.id,
      action: "user_delete",
      targetUserId: req.params.id,
      details: { email: existing.email, role: existing.role, status: existing.status }
    });

    res.json({ message: "User deleted." });
  } catch (error) {
    next(error);
  }
}

async function changeUserStatus(req, res, next) {
  try {
    if (Number(req.params.id) === Number(req.user.id) && req.body.status !== "active") {
      return res.status(400).json({ message: "You cannot deactivate or suspend your own account." });
    }

    const existing = await userModel.getUserDetails(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found." });

    const user = await userModel.updateStatus(req.params.id, req.body.status);
    await auditLogModel.createAuditLog({
      adminId: req.user.id,
      action: "user_status_change",
      targetUserId: user.id,
      details: { before: existing.status, after: user.status }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function resetUserPassword(req, res, next) {
  try {
    const existing = await userModel.getUserDetails(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found." });

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await userModel.updatePassword(req.params.id, passwordHash);
    await auditLogModel.createAuditLog({
      adminId: req.user.id,
      action: "user_password_reset",
      targetUserId: user.id,
      details: { email: user.email }
    });

    res.json({ message: "Password reset successfully.", user });
  } catch (error) {
    next(error);
  }
}

async function changeUserRole(req, res, next) {
  try {
    const existing = await userModel.getUserDetails(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found." });

    const user = await userModel.updateRole(req.params.id, req.body.role);
    await auditLogModel.createAuditLog({
      adminId: req.user.id,
      action: "user_role_change",
      targetUserId: user.id,
      details: { before: existing.role, after: user.role }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await categoryModel.listCategories(req.query.search || "");
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const slug = req.body.slug || slugify(req.body.name);
    const category = await categoryModel.createCategory({ ...req.body, slug, createdBy: req.user.id });
    res.status(201).json({ category });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Category name or slug already exists." });
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const existing = await categoryModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Category not found." });
    const slug = req.body.slug || slugify(req.body.name);
    const category = await categoryModel.updateCategory(req.params.id, { ...req.body, slug });
    res.json({ category });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Category name or slug already exists." });
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await categoryModel.deleteCategory(req.params.id);
    res.json({ message: "Category deleted." });
  } catch (error) {
    next(error);
  }
}

async function listArticles(req, res, next) {
  try {
    const articles = await articleModel.listArticles(req.query);
    res.json({ articles });
  } catch (error) {
    next(error);
  }
}

async function createArticle(req, res, next) {
  try {
    const slug = req.body.slug || slugify(req.body.title);
    const article = await articleModel.createArticle({ ...req.body, slug, createdBy: req.user.id });
    res.status(201).json({ article });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Article slug already exists." });
    next(error);
  }
}

async function updateArticle(req, res, next) {
  try {
    const existing = await articleModel.getArticleById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Article not found." });
    const slug = req.body.slug || slugify(req.body.title);
    const article = await articleModel.updateArticle(req.params.id, { ...req.body, slug });
    res.json({ article });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Article slug already exists." });
    next(error);
  }
}

async function deleteArticle(req, res, next) {
  try {
    await articleModel.deleteArticle(req.params.id);
    res.json({ message: "Article deleted." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  stats,
  students,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  resetUserPassword,
  changeUserRole,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listArticles,
  createArticle,
  updateArticle,
  deleteArticle
};
