const express = require("express");
const { isAuth, isAdmin, isCourier, } = require('../util');

class DeliveryRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
        router.get("/", isAuth, isAdmin, this.get.bind(this));
        router.get("/today", isAuth, isCourier, this.get_today.bind(this));
        router.get("/7days", isAuth, isAdmin, this.get_7days.bind(this));
        router.get("/:id", isAuth, isCourier, this.get_id.bind(this));
        router.post("/", isAuth, isAdmin, this.post.bind(this));
        router.post("/today", isAuth, isAdmin, this.post_today.bind(this));
        router.put("/:id/latlon", isAuth, isCourier, this.put_id_latlon.bind(this));
        router.put("/:id/success", isAuth, isCourier, this.put_id_success.bind(this));
        router.put("/:id/fail", isAuth, isCourier, this.put_id_fail.bind(this));
        router.put("/:id/missed", isAuth, isAdmin, this.put_id_missed.bind(this));
        router.delete("/:id", isAuth, isAdmin, this.delete_id.bind(this));
        return router;
  };
  async get(req, res) {
    try {
        const delivery = await this.knex("delivery")
        .orderBy("delivery._id","desc");
        const order = await this.knex("order");
        const order_items = await this.knex("order_item");
        for (let i = 0; i < order_items.length; i++) {
            order_items[i].image = JSON.parse(order_items[i].image);
        };
        const payments = await this.knex("payment");
        const shipments = await this.knex("shipment");
        const shipping_prices = await this.knex("shippingprice");
        const user = await this.knex("user").column("_id","name","email","phone");
        const facebook_user = await this.knex("facebook_user").column("_id","name","email","phone");
        const anonymous_user = await this.knex("anonymous_user").column("_id","name","email","phone","recipient","recipientPhone");
        let answer = [];
        for (let i = 0; i < delivery.length; i++) {
            let order_id = Number(delivery[i].order_id);
            let current_order = {};
            for (let j = 0; j < order.length; j++) {
                if (order[j]._id == order_id) {current_order = order[j];};
            };
            let current_order_items = [];
            for (let j = 0; j < order_items.length; j++) {
                if (order_items[j].order_id == order_id) {current_order_items.push(order_items[j]);};
            };
            let current_payment = {};
            for (let j = 0; j < payments.length; j++) {
                if (payments[j].order_id == order_id) {current_payment = payments[j];};
            };
            let current_shipment = {};
            for (let j = 0; j < shipments.length; j++) {
                if (shipments[j]._id == current_order.shipment_id) {current_shipment = shipments[j];};
            };
            let current_shipping_price = 0;
            for (let j = 0; j < shipping_prices.length; j++) {
                if (shipping_prices[j]._id == current_order.shippingprice_id) {
                    current_shipping_price = shipping_prices[j].shippingfee;
                };
            };
            let current_user = {};
            if (current_order.user) {
                for (let j = 0; j < user.length; j++) {
                    if (user[j]._id == current_order.user) {current_user = user[j];};
                };
            };
            if (current_order.facebook_user) {
                for (let j = 0; j < facebook_user.length; j++) {
                    if (facebook_user[j]._id == current_order.facebook_user) {current_user = facebook_user[j];};
                };
            };
            if (current_order.anonymous_user) {
                for (let j = 0; j < anonymous_user.length; j++) {
                    if (anonymous_user[j]._id == current_order.anonymous_user) {current_user = anonymous_user[j];};
                };
            };
            let payload = {...current_order, orderItems: [...current_order_items], shippingPrice: current_shipping_price,
                shipping:{...current_shipment}, payment:{...current_payment}, user: {...current_user}, delivery: {...delivery[i]}};
            answer.push(payload);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_id(req, res) {
    const delivery = await this.knex("delivery").where({_id: Number(req.params.id)});
    if (delivery[0]) {
        const order_id = Number(delivery[0].order_id);
        const order = await this.knex("order").where({_id: order_id});
        const order_items = await this.knex("order_item").where({order_id: order_id});
        const payments = await this.knex("payment").where({order_id: order_id});
        const shipments = await this.knex("shipment").where({_id: Number(order[0].shipment_id)});
        const shipping_prices = await this.knex("shippingprice").where({_id: Number(order[0].shippingprice_id)});
        const user = order[0].user ? await this.knex("user").where({_id: Number(order[0].user)}).column("name","email","phone") :
            order[0].facebook_user ? await this.knex("facebook_user").where({_id: Number(order[0].facebook_user)}).column("name","email","phone") :
            await this.knex("anonymous_user").where({_id: Number(order[0].anonymous_user)}).column("name","email","phone","recipient","recipientPhone");
        for (let i = 0; i < order_items.length; i++) {
            order_items[i].image = JSON.parse(order_items[i].image);
        };
        let payload = {...order[0], orderItems: order_items, shippingPrice: shipping_prices[0].shippingfee,
            shipping:{...shipments[0]}, payment:{...payments[0]}, user: {...user[0]}, delivery: {...delivery[0]}};
        res.send(payload);
    } else {
        res.status(404).send("Order Not Found.")
    }
  };
  async get_today(req, res) {
    let tomorrow = new Date();
    let yesterday = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setHours(0,0,0,0);
    yesterday.setHours(23,59,59,999);
    const delivery = await this.knex("delivery")
    .where("date","<",tomorrow).where("date",">",yesterday).orderBy("_id","desc");;
    if (delivery[0]) {
        let answer = [];
        for (let i = 0; i < delivery.length; i++) {
            const order_id = Number(delivery[i].order_id);
            const order = await this.knex("order").where({_id: order_id});
            const order_items = await this.knex("order_item").where({order_id: order_id});
            const payments = await this.knex("payment").where({order_id: order_id});
            const shipments = await this.knex("shipment").where({_id: Number(order[0].shipment_id)});
            const shipping_prices = await this.knex("shippingprice").where({_id: Number(order[0].shippingprice_id)});
            const user = order[0].user ? await this.knex("user").where({_id: Number(order[0].user)}).column("name","email","phone") :
                order[0].facebook_user ? await this.knex("facebook_user").where({_id: Number(order[0].facebook_user)}).column("name","email","phone") :
                await this.knex("anonymous_user").where({_id: Number(order[0].anonymous_user)}).column("name","email","phone","recipient","recipientPhone");
            for (let i = 0; i < order_items.length; i++) {
                order_items[i].image = JSON.parse(order_items[i].image);
            };
            let payload = {...order[0], orderItems: order_items, shippingPrice: shipping_prices[0].shippingfee,
                shipping:{...shipments[0]}, payment:{...payments[0]}, user: {...user[0]}, delivery: {...delivery[i]}};
            answer.push(payload);
        };
        res.send(answer);
    } else {
        res.send([]);
    }
  };
  async get_7days(req, res) {
    try {
        let lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        lastWeek.setHours(23,59,59,999);
        const delivery = await this.knex("delivery").where("date",">",lastWeek)
        .orderBy("success").orderBy("fail").orderBy("missed");
        const order = await this.knex("order");
        const order_items = await this.knex("order_item");
        for (let i = 0; i < order_items.length; i++) {
            order_items[i].image = JSON.parse(order_items[i].image);
        };
        const payments = await this.knex("payment");
        const shipments = await this.knex("shipment");
        const shipping_prices = await this.knex("shippingprice");
        const user = await this.knex("user").column("_id","name","email","phone");
        const facebook_user = await this.knex("facebook_user").column("_id","name","email","phone");
        const anonymous_user = await this.knex("anonymous_user").column("_id","name","email","phone","recipient","recipientPhone");
        let answer = [];
        for (let i = 0; i < delivery.length; i++) {
            let order_id = Number(delivery[i].order_id);
            let current_order = {};
            for (let j = 0; j < order.length; j++) {
                if (order[j]._id == order_id) {current_order = order[j];};
            };
            let current_order_items = [];
            for (let j = 0; j < order_items.length; j++) {
                if (order_items[j].order_id == order_id) {current_order_items.push(order_items[j]);};
            };
            let current_payment = {};
            for (let j = 0; j < payments.length; j++) {
                if (payments[j].order_id == order_id) {current_payment = payments[j];};
            };
            let current_shipment = {};
            for (let j = 0; j < shipments.length; j++) {
                if (shipments[j]._id == current_order.shipment_id) {current_shipment = shipments[j];};
            };
            let current_shipping_price = 0;
            for (let j = 0; j < shipping_prices.length; j++) {
                if (shipping_prices[j]._id == current_order.shippingprice_id) {
                    current_shipping_price = shipping_prices[j].shippingfee;
                };
            };
            let current_user = {};
            if (current_order.user) {
                for (let j = 0; j < user.length; j++) {
                    if (user[j]._id == current_order.user) {current_user = user[j];};
                };
            };
            if (current_order.facebook_user) {
                for (let j = 0; j < facebook_user.length; j++) {
                    if (facebook_user[j]._id == current_order.facebook_user) {current_user = facebook_user[j];};
                };
            };
            if (current_order.anonymous_user) {
                for (let j = 0; j < anonymous_user.length; j++) {
                    if (anonymous_user[j]._id == current_order.anonymous_user) {current_user = anonymous_user[j];};
                };
            };
            let payload = {...current_order, orderItems: [...current_order_items], shippingPrice: current_shipping_price,
                shipping:{...current_shipment}, payment:{...current_payment}, user: {...current_user}, delivery: {...delivery[i]}};
            answer.push(payload);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async post(req, res) {
    try {
        const { order_id, date, latitude, longitude, success, fail, } = req.body;
        let order = await this.knex("order").where({_id: order_id, isPaid: true});
        if (order[0]) {
            let newDelivery = {
                order_id, date: new Date(date),
                latitude, longitude,
                success, fail,
            };
            await this.knex.raw('SELECT setval(\'"delivery__id_seq"\', (SELECT MAX(_id) from "delivery"));');
            await this.knex('delivery').insert(newDelivery);
            res.send("done");
        } else {
            res.status(404).send({message: "Valid Order not Found"});
        };
    } catch (error) {
        res.status(401).send({message: error.message});
    };
  };
  async post_today(req, res) {
    try {
        let tomorrow = new Date();
        let yesterday = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        yesterday.setDate(yesterday.getDate() - 1);
        tomorrow.setHours(0,0,0,0);
        yesterday.setHours(23,59,59,999);
        const delivery = await this.knex("delivery")
        .where("date","<",tomorrow).where("date",">",yesterday);
        const shipments = await this.knex("order").join("shipment","shipment._id","order.shipment_id")
        .join("payment","payment.order_id","order._id")
        .where("time","<",tomorrow).where("time",">",yesterday).where({isPaid: true});
        let today = new Date();
        let flag2 = [];
        for (let i = 0; i < shipments.length; i++) {flag2.push(false);};
        for (let i = 0; i < delivery.length; i++) {
            for (let j = 0; j < shipments.length; j++) {
                if (delivery[i].order_id === shipments[j].order_id) {
                    flag2[j] = true;
                };
            };
        };
        for (let i = 0; i < shipments.length; i++) {
            if (flag2[i] === false) {
                let newDelivery = {
                    order_id: shipments[i].order_id,
                    date: today,
                };
                await this.knex.raw('SELECT setval(\'"delivery__id_seq"\', (SELECT MAX(_id) from "delivery"));');
                await this.knex('delivery').insert(newDelivery);
            };
        };
        res.send("done");
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async put_id_latlon(req, res) {
    try {
        const delivery = await this.knex("delivery").where({_id: Number(req.params.id)});
        if (delivery[0]) {
            const { latitude, longitude } = req.body;
            await this.knex("delivery").where({_id: Number(req.params.id)})
            .update({ latitude, longitude, success: false, fail: false });
            await this.knex("order").where({_id: Number(delivery[0].order_id)})
            .update({ isDelivered: false, deliveredAt: null, latitude, longitude, });
            res.send({ message: 'Delivery updated.' });
        } else {
        res.status(404).send({ message: 'Delivery not found.' })
        };
    }
    catch (error) {
        res.status(401).send({ message: error.message });
    }
  };
  async put_id_success(req, res) {
    try {
        const delivery = await this.knex("delivery").where({_id: Number(req.params.id)});
        if (delivery[0]) {
            const { latitude, longitude } = req.body;
            await this.knex("delivery").where({_id: Number(req.params.id)})
            .update({latitude, longitude, success: true, fail: false});
            const order = await this.knex("order").where({_id: Number(delivery[0].order_id)});
            const deliveredAt = order[0].deliveredAt || new Date().toLocaleString('en-GB', { timeZone: 'Asia/Hong_Kong' });
            await this.knex("order").where({_id: Number(delivery[0].order_id)})
            .update({ isDelivered: true, deliveredAt, latitude, longitude, });
            res.send({ message: 'Delivery updated.' });
        } else {
        res.status(404).send({ message: 'Delivery not found.' })
        };
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async put_id_fail(req, res) {
    try {
        const delivery = await this.knex("delivery").where({_id: Number(req.params.id)});
        if (delivery[0]) {
            const { latitude, longitude } = req.body;
            await this.knex("delivery").where({_id: Number(req.params.id)})
            .update({latitude, longitude, success: false, fail: true});
            await this.knex("order").where({_id: Number(delivery[0].order_id)})
            .update({ isDelivered: false, deliveredAt: null, latitude, longitude, });
            res.send({ message: 'Delivery updated.' });
        } else {
        res.status(404).send({ message: 'Delivery not found.' })
        };
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async put_id_missed(req, res) {
    try {
        const delivery = await this.knex("delivery").where({_id: Number(req.params.id)});
        if (delivery[0]) {
            if (delivery[0].success || delivery[0].fail) {
                res.status(403).send({ message: 'Delivery handled.'});
                return;
            };
            const { missed } = req.body;
            await this.knex("delivery").where({_id: Number(req.params.id)})
            .update({ missed });
            res.send({ message: 'Delivery updated.' });
        } else {
        res.status(404).send({ message: 'Delivery not found.' })
        };
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async delete_id(req, res) {
    try {
        const delivery = await this.knex("delivery").where({_id: Number(req.params.id)});
        if (delivery[0] && (delivery[0].latitude || delivery[0].missed) ) {
            res.status(403).send({ message: 'Delivery already progressing.' });
            return;
        };
        await this.knex("delivery").del().where({_id: Number(req.params.id)});
        res.send("done");
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
};

module.exports = DeliveryRouter;