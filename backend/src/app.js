const express = require("express");
const path = require("path"); // Node.js yo'llar bilan ishlash uchun
const cors = require("cors");
const app = express();

// Middleware-lar
app.use(cors());
app.use(express.json());

// API yo'nalishlari (Sizning kodingiz)
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const roomRoutes = require("./modules/rooms/room.routes");
const assetRoutes = require("./modules/assets/asset.routes");
const assetsMovementsRoutes = require("./modules/assets-movements/assets-movements.routes");
const departmentRoutes = require("./modules/departments/department.routes");
const assetCategories = require("./modules/asset-categories/asset-categories.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const dashboarRoutes = require("./modules/home/home.routes");
const userAssetsRoutes = require("./modules/userAssets/userAssets.routes");

// API larni ro'yxatdan o'tkazish
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/assets-movements", assetsMovementsRoutes);
app.use("/api/asset-categories", assetCategories);
app.use("/api/departments", departmentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboarRoutes);
app.use("/api/user-assets", userAssetsRoutes);

const frontendBuildPath = path.join(__dirname, "../../frontend/dist"); 
app.use(express.static(frontendBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

module.exports = app;