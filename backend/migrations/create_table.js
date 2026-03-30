exports.up = async function (knex) {
  // 1. Departments
  await knex.schema.createTable("departments", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique();
    table.timestamps(true, true);
  });

  // 2. Rooms
  await knex.schema.createTable("rooms", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.enu("type", ["room", "hall", "store", "other"]).defaultTo("room");
    table.integer("floor").nullable();
    table.enu("campus", ["campus1", "campus2"]).defaultTo("campus1");
    table
      .integer("department_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("departments")
      .onDelete("SET NULL");
    table.unique(["name", "campus"]);
    table.index("department_id");
    table.timestamps(true, true);
  });

  // 3. Users
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username").notNullable().unique();
    table.string("first_name").notNullable();
    table.string("last_name").nullable();
    table.string("middle_name").nullable();
    table.string("password").notNullable();
    table
      .enu("role", ["super_admin", "admin", "moderator", "user", "employee"])
      .defaultTo("employee");
    table
      .integer("room_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("rooms")
      .onDelete("SET NULL");
    table
      .integer("department_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("departments")
      .onDelete("SET NULL");
    table.enu("campus", ["campus1", "campus2"]).defaultTo("campus1");
    table.index("room_id");
    table.index("department_id");
    table.timestamps(true, true);
  });

  // 4. Asset Categories
  await knex.schema.createTable("asset_categories", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique();
    table.text("description").nullable();
    table.timestamps(true, true);
  });

  // 5. Assets
  await knex.schema.createTable("assets", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("inv_number").notNullable().unique();
    table.string("qr_token").nullable().unique();
    table
      .enu("status", [
        "new",
        "active",
        "inactive",
        "repair",
        "written_off",
        "not_found",
      ])
      .defaultTo("new");
    table.enu("type", ["permanent", "temporary"]).defaultTo("permanent");
    table.enu("units", ["piece", "complex"]).defaultTo("piece");
    table.enu("campus", ["campus1", "campus2"]).defaultTo("campus1");
    table.decimal("price", 20, 2).nullable();
    table.date("purchase_date").nullable();
    table
      .integer("category_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("asset_categories")
      .onDelete("SET NULL");
    table
      .integer("room_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("rooms")
      .onDelete("SET NULL");
    table
      .integer("department_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("departments")
      .onDelete("SET NULL");
    table.index("room_id");
    table.index("department_id");
    table.index("status");
    table.timestamps(true, true);
  });

  // 6. Department Assets
  await knex.schema.createTable("department_assets", (table) => {
    table.increments("id").primary();
    table
      .integer("department_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("departments")
      .onDelete("CASCADE");
    table
      .integer("asset_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("assets")
      .onDelete("CASCADE");
    table.unique(["department_id", "asset_id"]);
    table.index("department_id");
    table.index("asset_id");
    table.timestamps(true, true);
  });

  // 7. Inventory Sessions
  await knex.schema.createTable("inventory_sessions", (table) => {
    table.increments("id").primary();
    table
      .integer("room_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("rooms")
      .onDelete("CASCADE");
    table.string("name").nullable();
    table.integer("year").notNullable();
    table
      .integer("started_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamp("started_at").defaultTo(knex.fn.now());
    table.timestamp("finished_at").nullable();
    table.enu("status", ["open", "closed"]).defaultTo("open");
    table.unique(["room_id", "year"]);
    table.index("room_id");
    table.timestamps(true, true);
  });

  // 8. Asset Inventory
  await knex.schema.createTable("asset_inventory", (table) => {
    table.increments("id").primary();
    table
      .integer("asset_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("assets")
      .onDelete("CASCADE");
    table
      .integer("session_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("inventory_sessions")
      .onDelete("CASCADE");
    table
      .enu("status", [
        "new",
        "active",
        "inactive",
        "repair",
        "written_off",
        "not_found",
      ])
      .notNullable();
    table
      .integer("room_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("rooms")
      .onDelete("CASCADE");
    table
      .integer("verified_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamp("verified_at").nullable();
    table.text("notes").nullable();
    table.unique(["asset_id", "session_id"]);
    table.index("asset_id");
    table.index("session_id");
    table.timestamps(true, true);
  });

  // 9. Asset Movements
  await knex.schema.createTable("asset_movements", (table) => {
    table.increments("id").primary();
    table
      .integer("asset_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("assets")
      .onDelete("CASCADE");
    table
      .integer("from_room_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("rooms")
      .onDelete("SET NULL");
    table
      .integer("to_room_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("rooms")
      .onDelete("SET NULL");
    table
      .integer("moved_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamp("moved_at").defaultTo(knex.fn.now());
    table.text("notes").nullable();
    table.boolean("deleted").defaultTo(false);
    table.string("status").nullable();
    table.index("asset_id");
    table.timestamps(true, true);
  });

  // 10. User Tokens
  await knex.schema.createTable("user_tokens", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("refresh_token", 500).notNullable();
    table.timestamp("expires_at").notNullable();
    table.timestamp("revoked_at").nullable();
    table.index("user_id");
    table.timestamps(true, true);
  });

  // 11. User Assets (many-to-many)
  await knex.schema.createTable("user_assets", (table) => {
    table.increments("id").primary();

    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .integer("asset_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("assets")
      .onDelete("CASCADE");

    table.unique(["user_id", "asset_id"]);
    table.timestamp("assigned_at").defaultTo(knex.fn.now());
    table
      .integer("assigned_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.timestamps(true, true);
    table.index("user_id");
    table.index("asset_id");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("user_assets");
  await knex.schema.dropTableIfExists("user_tokens");
  await knex.schema.dropTableIfExists("asset_movements");
  await knex.schema.dropTableIfExists("asset_inventory");
  await knex.schema.dropTableIfExists("inventory_sessions");
  await knex.schema.dropTableIfExists("department_assets");
  await knex.schema.dropTableIfExists("assets");
  await knex.schema.dropTableIfExists("asset_categories");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("rooms");
  await knex.schema.dropTableIfExists("departments");
};