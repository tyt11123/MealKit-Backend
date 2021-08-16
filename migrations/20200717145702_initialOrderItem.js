const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("order_item", (table) => {
        table.increments("_id");
        table.integer("order_id").notNullable();
        table.foreign("order_id").references("order._id");
        table.string("name", 10485760).notNullable();
        table.integer("qty").notNullable();
        table.string("image", 10485760).notNullable();
        table.float("price").notNullable();
        table.integer("product").notNullable();
        table.foreign("product").references("product._id");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('order_item')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("order_item");
};
