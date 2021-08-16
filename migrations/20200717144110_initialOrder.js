const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("order", (table) => {
        table.increments("_id");
        table.bigInteger("user");
        table.foreign("user").references("user._id");
        table.bigInteger("facebook_user");  // for adapting Facebook ID besides local ID
        table.foreign("facebook_user").references("facebook_user._id");
        table.bigInteger("anonymous_user");
        table.foreign("anonymous_user").references("anonymous_user._id");
        table.float("itemsPrice");
        // table.float("taxPrice");
        table.integer("shippingprice_id");
        table.foreign("shippingprice_id").references("shippingprice._id");
        table.integer("shipment_id");
        table.foreign("shipment_id").references("shipment._id");
        table.float("redemptionPrice");
        table.float("totalPrice");
        table.string("remark", 10485760);
        table.boolean("isPaid").defaultTo(false);
        table.datetime("paidAt");
        table.boolean("isDelivered").defaultTo(false);
        table.datetime("deliveredAt");
        table.string("latitude");
        table.string("longitude");
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now());
        table.datetime("updatedAt").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => knex.raw(onUpdateTrigger('order')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("order");
};
