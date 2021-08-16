const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("user_productcategory", (table) => {
        table.increments("_id");
        table.bigInteger("user_id").unsigned();
        table.foreign("user_id").references("user._id");
        table.bigInteger("facebook_user_id").unsigned();
        table.foreign("facebook_user_id").references("facebook_user._id");
        table.integer("productcategory_id").unsigned();
        table.foreign("productcategory_id").references("productcategory._id");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
      .then(() => knex.raw(onUpdateTrigger('user_productcategory')));;
};

exports.down = function(knex) {
    return knex.schema.dropTable("user_productcategory");
};
