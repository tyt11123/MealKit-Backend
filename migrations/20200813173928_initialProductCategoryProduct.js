const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("product_category", (table) => {
        table.increments("_id");
        table.integer("product_id").unsigned();
        table.foreign("product_id").references("product._id");
        table.integer("productcategory_id").unsigned();
        table.foreign("productcategory_id").references("productcategory._id");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
      .then(() => knex.raw(onUpdateTrigger('product_category')));;
};

exports.down = function(knex) {
    return knex.schema.dropTable("product_category");
};
