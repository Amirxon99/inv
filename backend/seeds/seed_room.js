// seeds/seed_rooms.js

exports.seed = async function(knex) {
  const rooms = [
    { name: "101", type: "room", floor: 1, campus: "campus1" },
    { name: "102", type: "room", floor: 1, campus: "campus1" },
    { name: "103", type: "room", floor: 1, campus: "campus1" },
    { name: "201", type: "room", floor: 2, campus: "campus1" },
    { name: "Main Hall", type: "hall", floor: 0, campus: "campus1" }
  ];

  // Jadvalni tozalash (ixtiyoriy)
  await knex('rooms').del();

  // Insert qilish
  await knex('rooms').insert(rooms);

  console.log("Default rooms seeded");
};