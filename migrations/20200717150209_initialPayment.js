const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("payment", (table) => {
        table.increments("_id");
        table.integer("order_id").notNullable().unique();
        table.foreign("order_id").references("order._id");
        table.string("paymentMethod", 10485760).notNullable();
        //paypal
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('payment')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("payment");
};
