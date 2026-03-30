

exports.seed = async function(knex) {
  const departments = [
    { name: "AKT" },
    { name: "HR" },
    { name: "Finance Department" },
    { name: "Logistics" },
    { name: "Maintenance" }
  ];

 
  await knex('departments').del();

  await knex('departments').insert(departments);
};