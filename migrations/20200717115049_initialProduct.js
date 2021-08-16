const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("product", (table) => {
        table.increments("_id");
        table.string("name", 10485760).notNullable();
        table.string("image", 10485760).notNullable();
        table.integer("type", 10485760).notNullable();
        table.foreign("type").references("producttype._id");
        table.float("price").notNullable();
        table.integer("countInStock").notNullable();
        table.string("description", 10485760).notNullable();
        table.string("ingredient", 10485760).notNullable();
        table.boolean("landingPage").defaultTo(true);
        table.float("calories").notNullable();
        table.float("difficulty").notNullable();
        table.float("c_time").notNullable();
        table.integer("numReviews").notNullable();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('product')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("product");
};
