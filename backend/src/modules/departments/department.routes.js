const express = require("express");
const router = express.Router();
const departmentController = require("./department.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");

router.post("/", authMiddleware, roleMiddleware("super_admin","admin"), departmentController.createDepartment);
router.get("/list", authMiddleware, departmentController.getDepartments);
router.get("/:id", authMiddleware, departmentController.getDepartmentById);
router.put("/:id", authMiddleware, roleMiddleware("super_admin","admin"), departmentController.updateDepartment);
router.delete("/:id", authMiddleware, roleMiddleware("super_admin"), departmentController.deleteDepartment);

module.exports = router;