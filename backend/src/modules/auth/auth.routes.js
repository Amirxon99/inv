const express = require("express");
const router = express.Router();
const { login, refresh,getMe,logout } = require("./auth.controller");    
const authMiddleware = require("../../middlewares/auth.middleware");


router.post("/login", login);


router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/user/me",authMiddleware, getMe);

module.exports = router;