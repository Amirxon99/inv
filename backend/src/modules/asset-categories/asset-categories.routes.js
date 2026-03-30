const express = require("express");
const router = express.Router();

const assetCategoryController = require("./asset-categories.controller");

const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

// CREATE
router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  assetCategoryController.createCategory
);

// LIST
router.get(
  "/list",
  authMiddleware,
  assetCategoryController.getCategories
);

// GET BY ID
router.get(
  "/:id",
  authMiddleware,
  assetCategoryController.getCategoryById
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  assetCategoryController.updateCategory
);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  assetCategoryController.deleteCategory
);

module.exports = router;