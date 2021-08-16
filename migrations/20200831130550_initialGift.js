const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("gift", (table) => {
        table.increments("_id");
        table.float("amount");
        table.float("balance");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
      .then(() => knex.raw(onUpdateTrigger('gift')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("gift");
};
