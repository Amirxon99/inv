const express = require("express");
const router = express.Router();
const assetController = require("./asset.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

/**
 * @route   POST /api/assets
 * @desc    Yangi aktiv yaratish
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  assetController.createAsset
);

/**
 * @route   GET /api/assets/list
 * @desc    Barcha aktivlar ro'yxatini olish
 * @access  Private
 */
router.get("/list", authMiddleware, assetController.getAssets);

/**
 * @route   GET /api/assets/view/:qr_token
 * @desc    QR token orqali jihoz ma'lumotlarini olish (Hamma uchun ochiq)
 * @access  Public
 */
// ❗ DIQQAT: authMiddleware olib tashlandi, shunda mehmonlar ham ko'ra oladi
router.get("/view/:qr_token", assetController.getAssetByQrToken);

/**
 * @route   PUT /api/assets/update/id/:id
 * @desc    ID orqali aktivni tahrirlash
 * @access  Private (Admin, Super Admin)
 */
router.put(
  "/update/id/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  assetController.updateAssetUniversal
);

/**
 * @route   PUT /api/assets/update/qr/:qr_token
 * @desc    QR Token orqali aktivni tahrirlash
 * @access  Private (Admin, Super Admin)
 */
router.put(
  "/update/qr/:qr_token",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  assetController.updateAssetUniversal
);

/**
 * @route   GET /api/assets/:id
 * @desc    ID orqali bitta aktiv ma'lumotini olish
 * @access  Private
 */
router.get("/:id", authMiddleware, assetController.getAssetById);

/**
 * @route   DELETE /api/assets/:id
 * @desc    Aktivni o'chirish
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  assetController.deleteAsset
);

module.exports = router;