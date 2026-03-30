const express = require("express");
const router = express.Router();
const roomController = require("./room.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

router.post("/", authMiddleware, roleMiddleware("super_admin","admin"), roomController.createRoom);
router.get("/list", authMiddleware, roomController.getRooms);
router.get("/:id", authMiddleware, roomController.getRoomById);
router.put("/:id", authMiddleware, roleMiddleware("super_admin","admin"), roomController.updateRoom);
router.delete("/:id", authMiddleware, roleMiddleware("super_admin"), roomController.deleteRoom);

module.exports = router;