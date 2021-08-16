const { FeedbackContext } = require("twilio/lib/rest/api/v2010/account/call/feedback");

const onUpdateTrigger = table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON "${table}"
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

exports.up = function(knex) {
    return knex.schema.createTable("shippingprice", (table) => {
        table.increments("_id");
        table.integer("shippingfee").notNullable();
        table.string("name", 10485760).notNullable(); // price range
        // shippingfee :
        // below 199---$60
        // 200-499--- $20
        // 500 --- free
      })
    .then(() => knex.raw(onUpdateTrigger('shippingprice')));
};

exports.down = function(knex) {
    return knex.schema.dropTable("shippingprice");
};