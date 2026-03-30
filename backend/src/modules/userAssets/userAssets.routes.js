const router = require("express").Router();
const controller = require("./userAssets.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

// Foydalanuvchi assetlari faqat authorized foydalanuvchilar ko‘ra oladi
const roles = roleMiddleware("super_admin", "admin");

// 🔹 Routes
router.get("/:userId/assets", authMiddleware, roles, controller.getUserAssets);
router.post("/:userId/assets", authMiddleware, roles, controller.addUserAsset);
router.delete("/:userId/assets/:assetId", authMiddleware, roles, controller.deleteUserAsset);

module.exports = router;