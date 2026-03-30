const express = require("express");
const router = express.Router();
const inventoryController = require("./inventory.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const roles = roleMiddleware("super_admin", "admin", "employee");
router.post("/start", authMiddleware, roles, inventoryController.startSession);
router.post("/scan", authMiddleware, roles, inventoryController.scanAsset);
router.get("/:sessionId/assets", authMiddleware, roles, inventoryController.getSessionAssets);
router.get("/:sessionId", authMiddleware, roles, inventoryController.getSession);
router.post("/finish/:sessionId", authMiddleware, roles, inventoryController.finishSession);

module.exports = router;