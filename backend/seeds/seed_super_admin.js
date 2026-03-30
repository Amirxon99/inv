const bcrypt = require("bcryptjs");

exports.seed = async function(knex) {
  try {
    const hashedPassword = await bcrypt.hash("12345", 10);

    await knex('users')
      .insert({
        first_name: "Super",
        last_name: "Admin",
        username: "super@admin",
        password: hashedPassword,
        role: "super_admin",
        department_id: null,
        room_id: null,
        campus: "campus1",
        created_at: new Date()
      })
      .onConflict('username')
      .merge(); // mavjud bo'lsa yangilaydi

    console.log("✅ Super Admin muvaffaqiyatli bazaga qo‘shildi!");
  } catch (err) {
    console.error("❌ Seedingda xatolik:", err.message);
  }
};