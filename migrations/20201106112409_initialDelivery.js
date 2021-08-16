const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("delivery", (table) => {
        table.increments("_id");
        table.integer("order_id").notNullable();
        table.foreign("order_id").references("order._id");
        table.date("date").notNullable();
        table.string("latitude");
        table.string("longitude");
        table.boolean("success").defaultTo(false);
        table.boolean("fail").defaultTo(false);
        table.boolean("missed").defaultTo(false);
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
      .then(() => knex.raw(onUpdateTrigger('delivery')));;
};

exports.down = function(knex) {
    return knex.schema.dropTable("delivery");
};
