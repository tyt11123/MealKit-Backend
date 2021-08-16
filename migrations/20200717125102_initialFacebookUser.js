const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("facebook_user", (table) => {
        table.increments();
        table.bigInteger("_id").notNullable().unique(); // facebook ID
        table.string("name", 10485760).notNullable();
        table.string("email", 10485760).notNullable();
        table.string("phone", 10485760);
        table.boolean("isAdmin").notNullable();
        table.boolean("isCourier").notNullable();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('facebook_user')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("facebook_user");
};
