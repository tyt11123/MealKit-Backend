const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("redemption", (table) => {
        table.increments("_id");
        table.integer("voucher_id").unsigned().notNullable();
        table.foreign("voucher_id").references("voucher._id");
        table.integer("order_id").unsigned().notNullable();
        table.foreign("order_id").references("order._id");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
      .then(() => knex.raw(onUpdateTrigger('redemption')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("redemption");
};
