const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("voucher", (table) => {
        table.increments("_id");
        table.string("code");
        table.string("type");
        table.integer("discount_id").unsigned();
        table.foreign("discount_id").references("discount._id");
        table.integer("gift_id").unsigned();
        table.foreign("gift_id").references("gift._id");
        table.integer("redeemable_qty");
        table.integer("redeemed_qty");
        table.boolean("active");
        table.boolean("published");
        table.datetime("expiredAt");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
      })
      .then(() => knex.raw(onUpdateTrigger('voucher')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("voucher");
};
