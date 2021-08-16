const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("shipping", (table) => {
        table.increments("_id");
        table.bigInteger("user_id").notNullable();
        table.string("address", 10485760).notNullable();
        table.string("area", 10485760).notNullable();
        table.string("city", 10485760).notNullable();
        table.string("country", 10485760).notNullable();
        table.string("latitude").notNullable();
        table.string("longitude").notNullable();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('shipping')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("shipping");
};
