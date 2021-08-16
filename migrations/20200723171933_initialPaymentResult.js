const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("payment_result", (table) => {
        table.increments("_id");
        table.integer("order_id").notNullable();
        table.foreign("order_id").references("order._id");
        table.string("payerID", 10485760);
        table.string("orderID", 10485760);
        table.string("paymentID", 10485760);
        //for paypal ONLY
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('payment_result')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("payment_result");
};
