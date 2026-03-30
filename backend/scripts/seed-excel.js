const { runImport } = require('../src/utils/importExcel');

async function main() {
  try {
    console.log("Exceldan ma'lumotlar import qilinmoqda...");
    await runImport('./server/uploads/inv2026.xlsm', 'campus1', 'IT Department');
    console.log("Import muvaffaqiyatli yakunlandi!");
    process.exit(0);
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
    process.exit(1);
  }
}

main();