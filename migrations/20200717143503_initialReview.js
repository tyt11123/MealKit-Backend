const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("review", (table) => {
        table.increments("_id");
        table.integer("product_id").notNullable();
        table.foreign("product_id").references("product._id");
        table.string("name", 10485760).notNullable();
        table.float("rating").notNullable();
        table.string("comment", 10485760).notNullable();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('review')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("review");
};
