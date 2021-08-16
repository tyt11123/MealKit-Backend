const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("priceplan", (table) => {
        table.increments("_id");
        table.integer("qty");
        table.float("bundle_price");
        table.float("ceiling");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
    .then(() => knex.raw(onUpdateTrigger('priceplan')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("priceplan");
};