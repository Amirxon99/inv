require("dotenv").config();

module.exports = {
  // Lokal kompyuterda ishlash uchun
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },

  // RENDER (PRODUCTION) UCHUN - BU QISMI SHART!
  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL, // Render-dagi o'sha uzun kodni oladi
      ssl: { rejectUnauthorized: false }, // Neon.tech uchun bu shart!
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};