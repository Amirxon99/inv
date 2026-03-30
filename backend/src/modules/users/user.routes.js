const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const userController = require("./user.controller");

// CREATE USER
router.post("/create", authMiddleware, roleMiddleware("super_admin", "admin"), userController.createUser);

// GET ALL USERS
router.get("/list", authMiddleware, roleMiddleware("super_admin", "admin", "moderator"), userController.getUsers);

// GET ONE USER
router.get("/:id", authMiddleware, userController.getUserById);

// UPDATE USER
router.put("/update/:id", authMiddleware, roleMiddleware("super_admin", "admin"), userController.updateUser);

// DELETE USER
router.delete("/:id", authMiddleware, roleMiddleware("super_admin"), userController.deleteUser);

module.exports = router;