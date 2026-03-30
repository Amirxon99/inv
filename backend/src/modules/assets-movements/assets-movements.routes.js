const express = require("express");
const router = express.Router();
const assetMovementsController = require("./assets-movements.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");


router.get("/", authMiddleware, assetMovementsController.getAssetsMovements);


module.exports = router;