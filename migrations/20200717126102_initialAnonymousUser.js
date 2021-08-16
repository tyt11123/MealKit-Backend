const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("anonymous_user", (table) => {
        table.bigIncrements("_id");
        table.string("name", 10485760).notNullable();
        table.string("email", 10485760).notNullable();
        table.string("phone", 10485760).notNullable();
        table.string("recipient", 10485760).notNullable();
        table.string("recipientPhone", 10485760).notNullable();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('anonymous_user')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("anonymous_user");
};
