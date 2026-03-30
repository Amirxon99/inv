const router = require("express").Router();
const controller = require("./home.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const allowedRoles = roleMiddleware("super_admin", "admin", "employee");

router.get(
  "/", 
  authMiddleware, 
  allowedRoles, 
  controller.getDashboardStats
);

module.exports = router;