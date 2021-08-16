const express = require("express");
const { isAuth, isAdmin, isCourier, getAuth, } = require('../util');

class OrderRouter {
    constructor(knex, transporter) {
        this.knex = knex;
        this.transporter = transporter;
    };
    router() {
        let router = express.Router();

        router.get("/", isAuth, this.get.bind(this));
        router.get("/mine", isAuth, this.get_mine.bind(this));
        router.get("/courier", isAuth, isCourier, this.get_courier.bind(this));
        router.get("/:id", isAuth, this.get_id.bind(this));
        router.delete('/:id', isAuth, isAdmin, this.delete_id.bind(this));
        router.put("/:id/info", isAuth, isAdmin, this.put_id_info.bind(this));
        router.put("/:id/deliver", isAuth, isCourier, this.put_id_deliver.bind(this));
        router.post("/anonymous", this.post_anonymous.bind(this));
        router.post("/", isAuth, this.post.bind(this));
        router.put("/:id/pay", this.put_id_pay.bind(this));
        router.post("/clientmail", this.post_clientmail.bind(this));
        console.log("In the router");

        return router;
    };
    async get(req, res) {
        const orders = await this.knex("order");
        const users = await this.knex("user")
        .column("_id","name","email","phone","isAdmin");
        const facebookusers = await this.knex("facebook_user")
        .column("_id","name","email","phone","isAdmin");
        const order_items = await this.knex("order_item");
        const shipments = await this.knex("shipment").orderBy('time','desc');
        const shipping_prices = await this.knex("shippingprice");
        const payments = await this.knex("payment");
        const anonymous_users = await this.knex("anonymous_user");
        for (let i = 0; i < orders.length; i++) {
            for (let j = 0; j < facebookusers.length; j++) {
                if (orders[i].facebook_user === facebookusers[j]._id) {
                    orders[i].user = {...facebookusers[j]};
                };
            };
            for (let j = 0; j < users.length; j++) {
                if (orders[i].user === users[j]._id) {
                    orders[i].user = {...users[j]};
                };
            };
            for (let j = 0; j < anonymous_users.length; j++) {
                if (orders[i].anonymous_user === anonymous_users[j]._id) {
                    orders[i].anonymous_user = {...anonymous_users[j]};
                };
            };
            orders[i].orderItems = [];
            for (let k = 0; k < order_items.length; k++) {
                if (orders[i]._id === order_items[k].order_id) {
                    order_items[k].image = JSON.parse(order_items[k].image);
                    orders[i].orderItems.push(order_items[k]);
                };
            };
            orders[i].shipping = {};
            for (let l = 0; l < shipments.length; l++) {
                if (orders[i].shipment_id === shipments[l]._id) {
                    orders[i].shipping = {...shipments[l]};
                }
            }
            orders[i].shippingPrice = 0;
            for (let n = 0; n < shipping_prices.length; n++) {
                if (orders[i].shippingprice_id === shipping_prices[n]._id) {
                    orders[i].shippingPrice = shipping_prices[n].shippingfee;
                }
            }
            orders[i].payment = {};
            for (let m = 0; m < payments.length; m++) {
                if (orders[i]._id === payments[m].order_id) {
                    orders[i].payment = {...payments[m]};
                }
            }
        };
        let answer = [];
        for (let i = 0; i < shipments.length; i++) {
            answer.push(undefined);
        };
        for (let i = 0; i < shipments.length; i++) {
            for (let j = 0; j < orders.length; j++) {
                if (orders[j].shipment_id === shipments[i]._id) {
                    answer[i] = orders[j];
                }
            };
        };
        res.send(answer);
    };
    async get_mine(req, res) {
        let orders = [];
        if (Number(req.user._id) < 100000000000) {
            orders = await this.knex("order").where({user: Number(req.user._id)}).orderBy('_id','desc');
        } else {
            orders = await this.knex("order").where({facebook_user: Number(req.user._id)}).orderBy('_id','desc');
        };
        const order_items = await this.knex("order_item");
        const shipments = await this.knex("shipment");
        const shipping_prices = await this.knex("shippingprice");
        const payments = await this.knex("payment");
        for (let i = 0; i < orders.length; i++) {
            orders[i].orderItems = [];
            for (let k = 0; k < order_items.length; k++) {
                if (orders[i]._id === order_items[k].order_id) {
                    order_items[k].image = JSON.parse(order_items[k].image);
                    orders[i].orderItems.push(order_items[k]);
                };
            };
            orders[i].shipping = {};
            for (let l = 0; l < shipments.length; l++) {
                if (orders[i].shipment_id === shipments[l]._id) {
                    orders[i].shipping = {...shipments[l]};
                }
            }
            orders[i].shippingPrice = 0;
            for (let n = 0; n < shipping_prices.length; n++) {
                if (orders[i].shippingprice_id === shipping_prices[n]._id) {
                    orders[i].shippingPrice = shipping_prices[n].shippingfee;
                }
            }
            orders[i].payment = {};
            for (let m = 0; m < payments.length; m++) {
                if (orders[i]._id === payments[m].order_id) {
                    orders[i].payment = {...payments[m]};
                }
            }
        };
        res.send(orders);
    };
    async get_courier(req, res) {
        let tomorrow = new Date();
        let last_week = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        last_week.setDate(last_week.getDate() - 7);
        tomorrow = tomorrow.toISOString().slice(0, 10);
        last_week = last_week.toISOString().slice(0, 10);
        const orders = await this.knex("order").join("shipment","shipment._id","order.shipment_id")
        .where("time","<",tomorrow).where("time",">",last_week).where("isPaid","true");
        const users = await this.knex("user")
        .column("_id","name","email","phone","isAdmin");
        const facebookusers = await this.knex("facebook_user")
        .column("_id","name","email","phone","isAdmin");
        const anonymous_users = await this.knex("anonymous_user");
        for (let i = 0; i < orders.length; i++) {
            for (let j = 0; j < facebookusers.length; j++) {
                if (orders[i].facebook_user === facebookusers[j]._id) {
                    orders[i].user = {...facebookusers[j]};
                };
            };
            for (let j = 0; j < users.length; j++) {
                if (orders[i].user === users[j]._id) {
                    orders[i].user = {...users[j]};
                };
            };
            for (let j = 0; j < anonymous_users.length; j++) {
                if (orders[i].anonymous_user === anonymous_users[j]._id) {
                    orders[i].anonymous_user = {...anonymous_users[j]};
                };
            };
        };
        res.send(orders);
    };
    async get_id(req, res) {
        const order = await this.knex("order").where({_id: Number(req.params.id)});
        const order_items = await this.knex("order_item").where({order_id: Number(req.params.id)});
        const payments = await this.knex("payment").where({order_id: Number(req.params.id)});
        if ((order[0])&&
        ((req.user.isAdmin)||
        (req.user.isCourier)||
        (req.user._id === order[0].user)||
        (req.user._id === order[0].facebook_user))) {
            const shipments = await this.knex("shipment").where({_id: Number(order[0].shipment_id)});
            const shipping_prices = await this.knex("shippingprice").where({_id: Number(order[0].shippingprice_id)});
            const user = order[0].user ? await this.knex("user").where({_id: Number(order[0].user)}).column("name","email","phone") :
                order[0].facebook_user ? await this.knex("facebook_user").where({_id: Number(order[0].facebook_user)}).column("name","email","phone") :
                await this.knex("anonymous_user").where({_id: Number(order[0].anonymous_user)}).column("name","email","phone","recipient","recipientPhone");
            for (let i = 0; i < order_items.length; i++) {
                order_items[i].image = JSON.parse(order_items[i].image);
            };
            let payload = {...order[0], orderItems: order_items, shippingPrice: shipping_prices[0].shippingfee,
                shipping:{...shipments[0]}, payment:{...payments[0]}, user: {...user[0]}};
            res.send(payload);
        } else {
            res.status(404).send("Order Not Found.")
        }
    };
    async delete_id(req, res) {
        const order = await this.knex("order").where({_id: Number(req.params.id)});
        const order_items = await this.knex("order_item").where({order_id: Number(req.params.id)});
        const payments = await this.knex("payment").where({order_id: Number(req.params.id)});
        const shipments = await this.knex("shipment").where({order_id: Number(req.params.id)});
        if (order[0]) {
            const deletedOrder = {...order[0], orderItems: order_items,
                shipping:{...shipments[0]},payment:{...payments[0]}};

const p = await this.knex("shipment").where({_id: Number(req.params.id)}).del();
const q = await this.knex("shippingprice").where({_id: order[0].shippingprice_id}).del();
const a = await this.knex("order").where({_id: Number(req.params.id)}).del();
const b = await this.knex("order_item").where({order_id: Number(req.params.id)}).del();
const d = await this.knex("payment").where({order_id: Number(req.params.id)}).del();

            res.send(deletedOrder);
        } else {
            res.status(404).send("Order Not Found.")
        }
    };
    async post_anonymous(req, res) {
        try {
            const newShipment = req.body.shipping;
            await this.knex.raw('SELECT setval(\'"shipment__id_seq"\', (SELECT MAX(_id) from "shipment"));');
            let temp1 = await this.knex('shipment').insert(newShipment).returning("_id");
            const newAnonymous = req.body.user;
            await this.knex.raw('SELECT setval(\'"anonymous_user__id_seq"\', (SELECT MAX(_id) from "anonymous_user"));');
            let temp2 = await this.knex('anonymous_user').insert(newAnonymous).returning("_id");
            let temp3 = {shippingfee: req.body.shippingPrice};
            switch (true) {
                case (req.body.shippingPrice >= 60):
                temp3.name = "NT / Stanley / Tai Tam";
                break;
                default:
                temp3.name = "HK / KLN";
                break;
            };
            await this.knex.raw('SELECT setval(\'"shippingprice__id_seq"\', (SELECT MAX(_id) from "shippingprice"));');
            let temp4 = await this.knex('shippingprice').insert(temp3).returning('_id');
            const newOrder = {
                user: null,
                facebook_user: null,
                anonymous_user: Number(temp2[0]),
                itemsPrice: req.body.itemsPrice,
                shippingprice_id: Number(temp4[0]),
                redemptionPrice: req.body.redemptionPrice,
                totalPrice: req.body.totalPrice,
                remark: req.body.remark,
                shipment_id: Number(temp1[0]),
                isPaid: req.body.totalPrice > 0 ? false : true,
                paidAt: req.body.totalPrice > 0 ? null : new Date().toISOString(),
            };
            await this.knex.raw('SELECT setval(\'"order__id_seq"\', (SELECT MAX(_id) from "order"));');
            let result = await this.knex('order').insert({...newOrder}).returning('_id');
            if (result[0]) {
                const newOrderItems = req.body.orderItems.map(
                    x => Object.assign({
                        order_id: result[0],
                        image: JSON.stringify(x.image),
                        name: x.name,
                        price: x.price,
                        product: x.product,
                        qty: x.qty,
                    }));
                for (let i = 0; i < newOrderItems.length; i++) {
                    await this.knex.raw('SELECT setval(\'"order_item__id_seq"\', (SELECT MAX(_id) from "order_item"));');
                    await this.knex('order_item').insert(newOrderItems[i]);
                }
                const newPayment = {...req.body.payment, order_id: result[0]};
                await this.knex.raw('SELECT setval(\'"payment__id_seq"\', (SELECT MAX(_id) from "payment"));');
                await this.knex('payment').insert(newPayment);
                newOrder._id = result[0];
                newOrder.orderItems = newOrderItems;
                newOrder.shippingPrice = req.body.shippingPrice;
                newOrder.payment = req.body.payment;
                newOrder.isDelivered = false;
                res.status(201).send({ message: "New Order Created", data: newOrder });
            };
        } catch (error) {
            console.log(error);
            res.status(401).send({ message: error.message });
        };
    };
    async post(req, res) {
        try {
            let temp1 = {shippingfee: req.body.shippingPrice}
            switch (true) {
                case (req.body.shippingPrice >= 60):
                temp1.name = "NT / Stanley / Tai Tam";
                break;
                default:
                temp1.name = "HK / KLN";
                break;
            };
            await this.knex.raw('SELECT setval(\'"shippingprice__id_seq"\', (SELECT MAX(_id) from "shippingprice"));');
            let temp2 = await this.knex('shippingprice').insert(temp1).returning('_id');
            let temp3 = await this.knex('shipping').where({_id: req.body.shipping_id}).column("address","area","city","country","latitude","longitude");
            let newShipment = {time: req.body.shipping.time, ...temp3[0]};
            await this.knex.raw('SELECT setval(\'"shipment__id_seq"\', (SELECT MAX(_id) from "shipment"));');
            let temp4 = await this.knex('shipment').insert(newShipment).returning("_id");
            const newOrder = {
                user: null,
                facebook_user: null,
                itemsPrice: req.body.itemsPrice,
                shippingprice_id: temp2[0],
                redemptionPrice: req.body.redemptionPrice,
                totalPrice: req.body.totalPrice,
                remark: req.body.remark,
                shipment_id: temp4[0],
                isPaid: req.body.totalPrice > 0 ? false : true,
                paidAt: req.body.totalPrice > 0 ? null : new Date().toISOString(),
            };
            if (Number(req.user._id) < 100000000000) {
                newOrder.user = req.user._id;
            } else {
                newOrder.facebook_user = req.user._id;
            };
            await this.knex.raw('SELECT setval(\'"order__id_seq"\', (SELECT MAX(_id) from "order"));');
            let result = await this.knex('order').insert(newOrder).returning('_id');
            if (result[0]) {
                const newOrderItems = req.body.orderItems.map(
                    x => Object.assign({
                        order_id: result[0],
                        image: JSON.stringify(x.image),
                        name: x.name,
                        price: x.price,
                        product: x.product,
                        qty: x.qty,
                    }));
                for (let i = 0; i < newOrderItems.length; i++) {
                    await this.knex.raw('SELECT setval(\'"order_item__id_seq"\', (SELECT MAX(_id) from "order_item"));');
                    await this.knex('order_item').insert(newOrderItems[i]);
                }
                const newPayment = {...req.body.payment, order_id: result[0]};
                await this.knex.raw('SELECT setval(\'"payment__id_seq"\', (SELECT MAX(_id) from "payment"));');
                await this.knex('payment').insert(newPayment);
                newOrder._id = result[0];
                newOrder.orderItems = newOrderItems;
                newOrder.shippingPrice = req.body.shippingPrice;
                newOrder.payment = req.body.payment;
                newOrder.isDelivered = false;
                res.status(201).send({ message: "New Order Created", data: newOrder });
            }
        }
        catch (error) {
            console.log(error);
            res.status(401).send({ message: error.message });
        }
    };
    async put_id_info(req, res) {
        try {
            const order = await this.knex("order").where({_id: Number(req.params.id)});
            if (order[0]) {
                if (order[0].isDelivered) {
                    res.status(403).send({ message: 'Order already delivered.'});
                    return;
                };
                const { remark } = req.body;
                await this.knex("order").where({_id: Number(req.params.id)}).update({ remark });
                const updatedOrder = {...order[0], remark };
                res.send({ message: 'Order updated.', order: updatedOrder });
            } else {
            res.status(404).send({ message: 'Order not found.' })
            };
        }
        catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async put_id_deliver(req, res) {
        try {
            const order = await this.knex("order").where({_id: Number(req.params.id)});
            if (order[0]) {
                const { isDelivered, latitude, longitude } = req.body;
                const deliveredAt = isDelivered ? order[0].deliveredAt || new Date().toLocaleString('en-GB', { timeZone: 'Asia/Hong_Kong' }) : null;
                await this.knex("order").where({_id: Number(req.params.id)}).update({ isDelivered, deliveredAt, latitude, longitude });
                const updatedOrder = {...order[0], isDelivered, deliveredAt, latitude, longitude };
                res.send({ message: 'Order updated.', order: updatedOrder });
            } else {
            res.status(404).send({ message: 'Order not found.' })
            };
        }
        catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async put_id_pay(req, res) {
        try {
            const order = await this.knex("order").where({_id: Number(req.params.id)});
            const payments = await this.knex("payment").where({order_id: Number(req.params.id)});
            if (order[0] && payments[0]) {
                order[0].isPaid = true;
                order[0].paidAt = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Hong_Kong' });
                payments[0].paymentMethod = req.body.payment_method_types[0];
                let paymentResult = {
                    order_id: Number(req.params.id),
                    // payerID: req.body.payerID,
                    // orderID: req.body.orderID,
                    // paymentID: req.body.paymentID,
                    payerID: req.body.description,
                    orderID: req.body.id,
                    paymentID: req.body.payment_method,
                };
                await this.knex("order").where({_id: Number(req.params.id)}).update(order[0]);
                await this.knex("payment").where({order_id: Number(req.params.id)}).update(payments[0]);
                await this.knex.raw('SELECT setval(\'"payment_result__id_seq"\', (SELECT MAX(_id) from "payment_result"));');
                await this.knex('payment_result').insert(paymentResult);
                const updatedOrder = {...order[0], payment: {...payments[0], paymentResult: paymentResult}};
                res.send({ message: 'Order Paid.', order: updatedOrder });
            } else {
            res.status(404).send({ message: 'Order not found.' })
            };
        }
        catch (error) {
            console.log(error);
            res.status(401).send({ message: error.message });
        }
    };
    async post_clientmail(req, res) {
        let data = req.body;
        let user = getAuth(req);

        let mailOptions = {
          from: "no.reply_meal.kit@gmail.com",
          to: data.email,
          bcc: "no.reply_meal.kit@gmail.com",
          subject: `Payment Receipt from MealKit - Order# ${data._id}`,
          html: `
          <div style="margin:.5rem;text-align: center;">
          <div style="display: inline-block;">

              <a target="_blank" href="${process.env.REACT_FRONTEND}"
                  style="display:inline-flex;text-decoration: none;font-size: 1.1rem;color: black;">
                  <img src="${process.env.REACT_FRONTEND}/static/media/logoMealkit.d54da333.svg"
                      style="width:5rem;font-size:1.5rem;">
                  <h1>MEALKIT</h1></img>
              </a>
              <br>
              <h3>Thank you for your purchase!</h3>
              <br>
              <p style="color:#777;font-size: 1.1rem;margin-left: 25%;
              margin-right: 25%;">Hi ${data.name}, we will ship your order according
                  to stock availablity.
                  An email with tracking number will be sent to you once your order is shipped. Thank you.</p>
      ${user ?
        `
                <div
                style="justify-content: space-around; display: inline-flex;border-bottom: 2px solid rgba(4,17,25,0.27);">
                <a target="_blank" style="text-decoration: none;
                        font-size: 1.1rem;"
                    href="${process.env.REACT_FRONTEND}/signin?redirect=/order/${data._id}">
                    <p style="background-color: #f36127;
                width: 9rem;
                border-radius: .5rem;
                padding: 1rem;
                color: white;">View your order</p>
                </a>

                <h4 style="padding: 1rem;">Or</h4>
                <a target="_blank" style="text-decoration: none;
                        font-size: 1.1rem;"
                    href="${process.env.REACT_FRONTEND}/signin?redirect=/order/${data._id}">
                    <p style="background-color: #113067;
                width: 9rem;
                border-radius: .5rem;
                padding: 1rem;
                color: white;">Visit our site</p>
                </a>
            </div>
      `:''}
              <div style="display:flex;flex-direction: column;border-bottom: 1px solid rgba(4,17,25,0.27);">
                  <div style="border-bottom: 2px solid rgba(4,17,25,0.27);margin: 1rem;padding-bottom: .8rem;">
                      <h3>Order Summary</h3>
                      ${data.orderItems.map(x=>`
                      <div style="display: inline-flex;
                      border: 1px solid lightblue;

                      border-radius: .5rem;align-items: center;
                      margin: 1.5rem;">

                          <img src="${process.env.REACT_FRONTEND}/static/media/logoMealkit.d54da333.svg"
                              style="width:4rem;margin-left: .5rem;"></img>
                          <p style="margin: .5rem ;">
                              ${x.name}<br>
                              Quantity:&nbsp;${x.qty}
                          </p>
                          <p style="margin-left: 5rem;margin-right: 2rem;">
                              $ ${x.price}
                          </p>
                      </div>
                      `)}
                  </div>
                  <div style="justify-content: flex-end;flex-direction:column; margin: .5rem;">
                      <div style="margin-bottom: 1.3rem; border-bottom: 1px solid rgba(4,17,25,0.27);">
                          <div
                              style="display: inline-flex;justify-content: space-between;align-items: center; width: 40rem;">


                              <p style="margin: .5rem ;">
                                  Subtotal:

                              </p>
                              <p style="margin-left: 5rem;margin-right: 2rem;">
                                  $ ${data.itemsPrice}
                              </p>
                          </div>
                          <div
                              style="display: inline-flex;justify-content:space-between;align-items: center;width: 40rem;">
                              <p style="margin: .5rem ;">
                                  Shipping:

                              </p>
                              <p style="margin-left: 5rem;margin-right: 2rem;">
                                  $ ${data.shippingPrice}
                              </p>
                          </div>
        ${data.redemptionPrice ?
        `
                          <div
                              style="display: inline-flex;justify-content:space-between;align-items: center;width: 40rem;">
                              <p style="margin: .5rem ;">
                                  Discount:

                              </p>
                              <p style="margin-left: 5rem;margin-right: 2rem;">
                                  - $ ${data.redemptionPrice}
                              </p>
                          </div>
        `:''}
                      </div>
                      <div style="display: inline-flex;justify-content:space-between;align-items: center;width: 40rem;font-weight: bolder;font-size: 1.5rem;background-color: #f36127;
                      border-radius: 0.5rem;
                      color: white;">
                          <p style="margin: .5rem ;">
                              Total:

                          </p>
                          <p style="margin-left: 5rem;margin-right: 2rem;">
                              $ ${data.totalPrice}
                          </p>
                      </div>
                  </div>
              </div>

              <div style="display: flex; flex-direction: column;">
                  <h4>Customer Remarks</h4>
                  ${data.remark ? data.remark.split('\n').map(x=>`<div>${x}</div>`).join('') : "N/A"}
              </div>

              <div style="display: flex; flex-direction: column;">
                  <h4>Customer Information</h4>
                  <div style="display: flex; flex-direction: row; justify-content: space-around;">
                      <div style="display: inline-block; text-align: left;">
                          <h6 style="display: block;">
                              Shipping address<h6>
                                  <p style="display: block;font-size: 1rem;">
                                      ${data.name}<br>
                                      ${data.shipping.address},&nbsp;${data.shipping.area},&nbsp;
                                      ${data.shipping.city},&nbsp;${data.shipping.country},&nbsp;
                                  </p>
                      </div>
                      <div style="display: inline-block; text-align: left;">
                          <h6 style="display: block;">
                              Billing address<h6>
                                  <p style="display: block;font-size: 1rem;">
                                      ${data.name}<br>
                                      ${data.shipping.address},&nbsp;${data.shipping.area},&nbsp;
                                      ${data.shipping.city},&nbsp;${data.shipping.country},&nbsp;
                                  </p>
                      </div>
                  </div>
                  <div style="display: flex; flex-direction: row; justify-content: start;">
                      <div style="display: inline-block; text-align: left;">
                          <h6 style="display: block;">
                              Preferred Delivery Time<h6>
                                  <p style="display: block;font-size: 1rem;">
${new Date(data.shipping.time.split('~')[0]).toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' })} ~ ${new Date(data.shipping.time.split('~')[1]).toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' })}
                                  </p>
                      </div>
                  </div>
              </div>
              <div style="display: inline-flex;
                      border: 1px solid #113067;

                      border-radius: .5rem;align-items: center;
                      margin: 1.5rem;">
                  <h6 style="margin: .5rem ;">
                      Shipping status<br>
                      <span style="color:#777">${data.isDelivered ? 'Delivered' : 'Pending'}</span>
                  </h6>

                  <h6 style="margin: .5rem ;">
                      Payment status<br>
                      <span style="color:#777">${data.successPay ? 'Paid' : 'Pending'}</span>
                  </h6>

              </div>
              <hr>
              <p>This email is auto-generated. Please do not reply to this email. You can contact us at
              <a target="_blank" href="${process.env.REACT_FRONTEND}">
              ${process.env.REACT_FRONTEND}
              </a>
              </p>
          </div>

              `,
        };

        this.transporter.sendMail(mailOptions, (error, response) => {
          if (error) {
            res.status(401).send(error);
          } else {
            res.send(mailOptions);
          }

          this.transporter.close();
        });
    };
};

module.exports = OrderRouter;