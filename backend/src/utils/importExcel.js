const ExcelJS = require("exceljs");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASS || ""),
  port: process.env.DB_PORT || 5432,
});

// 🔑 Category mapping
const categoriesMap = [
  { id: 1, name: "Моноблок", keywords: ["Моноблок", "iMac", "All-in-One"] },
  {
    id: 2,
    name: "Ноутбук",
    keywords: ["Ноутбук", "Laptop", "Dell", "Lenovo", "HP", "Probook"],
  },
  {
    id: 3,
    name: "Принтер",
    keywords: ["Принтер", "Canon", "Epson", "Laser", "MFU", "МФУ"],
  },
  {
    id: 4,
    name: "Монитор",
    keywords: ["Монитор", "LCD", "LED", "Display", "Сенсорный монитор"],
  },
  { id: 5, name: "Сканер", keywords: ["Сканер", "Scanner", "WorkForce", "GT"] },
  {
    id: 6,
    name: "Телевизор",
    keywords: ["Телевизор", "TV", "LED", "LG", "Artel", "Avalon", "ROISON"],
  },
  {
    id: 7,
    name: "Микрофон",
    keywords: ["Микрофон", "Microphone", "Gooseneck"],
  },
  { id: 8, name: "Камера", keywords: ["Камера", "Camera", "HD DOME"] },
  {
    id: 9,
    name: "Сервер",
    keywords: ["Сервер", "HP Proliant", "DL380", "Lenovo ThinkServer"],
  },
  {
    id: 10,
    name: "Коммутатор",
    keywords: ["Коммутатор", "Switch", "Aruba", "HPE"],
  },
  { id: 11, name: "Проектор", keywords: ["Проектор", "Epson EB"] },
  { id: 12, name: "UPS", keywords: ["UPS"] },
  { id: 13, name: "Сенсорный инфокиоск", keywords: ["Инфокиоск", "сенсорный"] },
  {
    id: 14,
    name: "Прочее оборудование",
    keywords: ["Лупа", "Модуль", "Подсветка", "Кейс", "Прожектор"],
  },
  { id: 15, name: "Телесуфлер", keywords: ["Телесуфлер", "VISUALL"] },
];

// 🔍 Asset name bo‘yicha category aniqlash
function findCategoryIdByName(assetName) {
  assetName = assetName.toLowerCase();
  for (const cat of categoriesMap) {
    for (const kw of cat.keywords) {
      if (assetName.includes(kw.toLowerCase())) {
        return cat.id;
      }
    }
  }
  return null;
}

// 🔹 Asset Categoriesni bazaga kiritish
async function ensureCategories() {
  for (const cat of categoriesMap) {
    await pool.query(
      `INSERT INTO asset_categories (id, name, description, created_at)
             VALUES ($1, $2, '', NOW())
             ON CONFLICT (id) DO NOTHING`,
      [cat.id, cat.name],
    );
  }

  // 🔹 Sequence ni oxirgi ID ga moslash
  await pool.query(`
        SELECT setval(
            pg_get_serial_sequence('asset_categories','id'),
            (SELECT COALESCE(MAX(id),0) FROM asset_categories)
        );
    `);
}

async function runImport(filePath, campusName, deptName) {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(filePath);
  } catch (error) {
    console.error("❌ Faylni o'qishda xato:", error.message);
    return;
  }

  await ensureCategories();

  try {
    console.log("🧹 Eskirgan ma'lumotlar tozalanmoqda...");

    // usersga tegmaymiz, CASCADE ishlatmaymiz
    await pool.query(`
            TRUNCATE TABLE department_assets RESTART IDENTITY;
            TRUNCATE TABLE assets RESTART IDENTITY;
            TRUNCATE TABLE rooms RESTART IDENTITY;
            TRUNCATE TABLE departments RESTART IDENTITY;
        `);
  } catch (err) {
    console.error("❌ Tozalashda xatolik:", err.message);
  }

  const worksheet = workbook.getWorksheet(1);
  console.log(`🚀 Import boshlandi (11-qatordan): ${campusName} - ${deptName}`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 11; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const invNumberRaw = row.getCell(2).value;
    if (!invNumberRaw) continue;

    const invNumber = parseInt(invNumberRaw.toString().replace(/\s/g, ""));
    if (isNaN(invNumber)) continue;

    let assetName = (row.getCell(3).value || "").toString().trim();
    if (assetName.length > 255) assetName = assetName.substring(0, 252) + "...";

    const unitRaw = row.getCell(4).value?.toString().toLowerCase() || "";
    const unitEnum = unitRaw.includes("комплект") ? "complex" : "piece";

    const priceRaw = row.getCell(6).value;
    let price = 0;
    if (priceRaw) {
      const cleanedPrice = priceRaw
        .toString()
        .replace(/\s/g, "")
        .replace(",", ".");
      price = parseFloat(cleanedPrice) || 0;
    }

    const roomNameRaw = row.getCell(7).value;
    const roomName = roomNameRaw ? roomNameRaw.toString().trim() : "Noma'lum";

    try {
      // 🏢 Department
      let departmentId;
      const deptRes = await pool.query(
        `INSERT INTO departments (name, created_at) 
                 VALUES ($1, NOW()) 
                 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
                 RETURNING id`,
        [deptName],
      );
      departmentId = deptRes.rows[0]?.id;
      if (!departmentId) {
        const existingDept = await pool.query(
          `SELECT id FROM departments WHERE name = $1`,
          [deptName],
        );
        departmentId = existingDept.rows[0].id;
      }

      // 🏠 Room
      const floorMatch = roomName.match(/\d/);
      const floor = floorMatch ? parseInt(floorMatch[0]) : 1;

      const roomRes = await pool.query(
        `INSERT INTO rooms (name, floor, department_id, campus, type, created_at) 
                 VALUES ($1, $2, $3, $4, 'room', NOW()) 
                 ON CONFLICT (name, campus) DO UPDATE SET name = EXCLUDED.name 
                 RETURNING id`,
        [roomName, floor, departmentId, campusName],
      );
      const roomId = roomRes.rows[0].id;

      const qrToken = uuidv4();

      // 🔖 Category
      const categoryId = findCategoryIdByName(assetName);

      // 💾 Asset
      const assetRes = await pool.query(
        `INSERT INTO assets (
                    name, status, type, inv_number, qr_token,
                    room_id, campus, units, department_id, price, category_id, created_at
                ) VALUES ($1, 'active', 'permanent', $2, $3,
                          $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT (inv_number) DO UPDATE SET 
                    name = EXCLUDED.name,
                    room_id = EXCLUDED.room_id,
                    units = EXCLUDED.units,
                    price = EXCLUDED.price,
                    category_id = EXCLUDED.category_id,
                    department_id = EXCLUDED.department_id
                RETURNING id`,
        [
          assetName,
          invNumber,
          qrToken,
          roomId,
          campusName,
          unitEnum,
          departmentId,
          price,
          categoryId,
        ],
      );
      const assetId = assetRes.rows[0].id;

      // 🏷 department_assets
      await pool.query(
        `INSERT INTO department_assets (department_id, asset_id, created_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (department_id, asset_id) DO NOTHING`,
        [departmentId, assetId],
      );

      successCount++;
    } catch (err) {
      errorCount++;
      console.error(`❌ Xato qatorda ${i} (Inv: ${invNumber}):`, err.message);
    }
  }

  console.log(
    `🏁 Yakunlandi! Muvaffaqiyatli: ${successCount}, Xatoliklar: ${errorCount}`,
  );
}

module.exports = { runImport };
