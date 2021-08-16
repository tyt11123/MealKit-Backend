const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("productcategory", (table) => {
        table.increments("_id");
        table.string("name", 10485760).notNullable();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
    .then(() => knex.raw(onUpdateTrigger('productcategory')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("productcategory");
};