const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("user", (table) => {
        table.bigIncrements("_id");
        table.string("name", 10485760).notNullable();
        table.string("email", 10485760).notNullable().unique();
        table.string("password", 10485760).notNullable();
        table.string("phone", 10485760).unique();
        table.string("preference", 10485760);
        table.string("allergies", 10485760);
        table.string("tags", 10485760);
        table.string("spicy_rating", 10485760);
        table.boolean("isAdmin").notNullable();
        table.boolean("isCourier").notNullable();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('user')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("user");
};
