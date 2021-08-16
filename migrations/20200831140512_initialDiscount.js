const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("discount", (table) => {
        table.increments("_id");
        table.string("discount_type", 10485760).notNullable();
        table.float("percent_off");
        table.float("amount_minimum");
        table.float("amount_off");
        table.float("unit_off");
        table.string("unit_type", 10485760);
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
      .then(() => knex.raw(onUpdateTrigger('discount')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("discount");
};
