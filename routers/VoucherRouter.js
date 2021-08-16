const express = require("express");
const { isAuth, isAdmin } = require('../util');
const voucher_codes = require('voucher-code-generator');

class VoucherRouter {
  constructor(knex, transporter) {
      this.knex = knex;
      this.transporter = transporter;
  };
  router() {
      let router = express.Router();
      router.get("/validate", this.get_validate.bind(this));
      router.post("/:code/validate", this.post_code_validate.bind(this));
      router.put("/:code/enable", isAuth, isAdmin, this.put_code_enable.bind(this));
      router.put("/:code/disable", isAuth, isAdmin, this.put_code_disable.bind(this));
      router.put("/:code/balance", isAuth, isAdmin, this.put_code_balance.bind(this));
      router.put("/:code/publish", isAuth, this.put_code_publish.bind(this));
      router.get("/:code", isAuth, this.get_code.bind(this));
      router.put("/:id", isAuth, isAdmin, this.put_id.bind(this));
      router.delete("/:id", isAuth, isAdmin, this.delete_id.bind(this));
      router.post("/email", isAuth, this.post_email.bind(this));
      router.post("/welcome", isAuth, this.post_welcome.bind(this));
      router.get("/", isAuth, isAdmin, this.get.bind(this));
      router.post("/", isAuth, isAdmin, this.post.bind(this));
      return router;
  };
  async get_validate(req, res) {
    try {
      let { code, amount } = req.query;
      let result1 = await this.knex("voucher")
      .innerJoin("discount","discount._id","voucher.discount_id")
      .where({ code });
      let result2 = await this.knex("voucher")
      .innerJoin("gift","gift._id","voucher.gift_id")
      .where({ code });
      let result = [...result1, ...result2];
      let ans = { valid: false };
      if ( result[0] ) {
        ans = { valid: result[0].active, ...result[0] };
        if ( result[0].redeemable_qty ) {
          if ( result[0].redeemable_qty <= result[0].redeemed_qty ) {ans.valid = false;};
        };
        if ( Number(result[0].amount_minimum && amount) ) {
          if ( result[0].amount_minimum > amount ) {ans.valid = false;};
        };
        const now = new Date();
        if ( result[0].expiredAt && (now > result[0].expiredAt) ) {ans.valid = false;}
      };
      res.send(ans);
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async post_code_validate(req, res) {
    try {
      let { code } = req.params;
      let { amount } = req.body;
      let result1 = await this.knex("voucher")
      .innerJoin("discount","discount._id","voucher.discount_id")
      .where({ code });
      let result2 = await this.knex("voucher")
      .innerJoin("gift","gift._id","voucher.gift_id")
      .where({ code });
      let result = [...result1, ...result2];
      let ans = { valid: false };
      if ( result[0] ) {
        ans = { valid: result[0].active, ...result[0] };
        if ( result[0].redeemable_qty ) {
          if ( result[0].redeemable_qty <= result[0].redeemed_qty ) {ans.valid = false;};
        };
        if ( Number(result[0].amount_minimum && amount) ) {
          if ( result[0].amount_minimum > amount ) {ans.valid = false;};
        };
        const now = new Date();
        if ( result[0].expiredAt && (now > result[0].expiredAt) ) {ans.valid = false;}
      };
      res.send(ans);
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async put_code_enable(req, res) {
    try {
      let { code } = req.params;
      let result = await this.knex("voucher")
      .update("active",true)
      .where({ code });
      if ( result ) {res.send({active: true});} else {res.status(404).send("not found");};
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async put_code_disable(req, res) {
    try {
      let { code } = req.params;
      let result = await this.knex("voucher")
      .update("active",false)
      .where({ code });
      if ( result ) {res.send({active: false});} else {res.status(404).send("not found");};
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async put_code_balance(req, res) {
    try {
      let { code } = req.params;
      let { amount } = req.body;
      let result = await this.knex("voucher").where({ code });
      if ( result[0].gift_id ) {
        await this.knex("gift").increment("balance",amount).where({ _id: result[0].gift_id });
        let result1 = await this.knex("gift").where({ _id: result[0].gift_id });
        res.send(result1[0]);
      } else {
        res.status(404).send("not gift voucher");
      };
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async put_code_publish(req, res) {
    try {
      let { code } = req.params;
      let result = await this.knex("voucher")
      .update("published",true)
      .where({ code });
      if ( result ) {res.send({published: true});} else {res.status(404).send("not found");};
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async get_code(req, res) {
    try {
      let { code } = req.params;
      let result1 = await this.knex("voucher").where({ code });
      if ( result1[0] ) {
        let result2 = await this.knex("discount").where({_id:result1[0].discount_id});
        let result3 = await this.knex("gift").where({_id:result1[0].gift_id});
        let result4 = await this.knex("redemption").join("order","order._id","redemption.order_id")
        .where({ voucher_id: result1[0]._id });
        result1[0].discount = null;
        for (let j = 0; j < result2.length; j++) {
          if (result2[j]._id === result1[i].discount_id) {
            result1[0].discount = result2[j];
          };
        };
        result1[0].gift = null;
        for (let k = 0; k < result3.length; k++) {
          if (result3[k]._id === result1[i].gift_id) {
            result1[0].gift = result2[k];
          };
        };
        result1[0].redemption = [];
        for (let l = 0; l < result4.length; l++) {
          let order = await this.knex("order").where({_id: Number(result4[l].order_id)});
          let order_items = await this.knex("order_item").where({order_id: Number(result4[l].order_id)});
          let payments = await this.knex("payment").where({order_id: Number(result4[l].order_id)});
          let shipments = await this.knex("shipment").where({_id: Number(order[0].shipment_id)});
          let shipping_prices = await this.knex("shippingprice").where({_id: Number(order[0].shippingprice_id)});
          let payload = {...order[0], orderItems: order_items, shippingPrice: shipping_prices[0].shippingfee,
              shipping:{...shipments[0]},payment:{...payments[0]}};
          result1[i].redemption.push(payload);
        };
        res.send(result1[0]);
      } else {
        res.status(404).send('not found');
      };
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async delete_id(req, res) {
    try {
      let _id = req.params.id;
      let result1 = await this.knex("voucher").where({ _id });
      if ( result1[0] ) {
        let result4 = await this.knex("redemption").join("order","order._id","redemption.order_id")
        .where({ voucher_id: result1[0]._id });
        if ( result4[0] ) {
          res.status(403).send({ message: "Cannot delete redeemed coupon"});
        } else {
          let result5 = await this.knex("voucher").where({ _id }).del();
          let result2 = await this.knex("discount").where({_id:result1[0].discount_id}).del();
          let result3 = await this.knex("gift").where({_id:result1[0].gift_id}).del();
          res.send(result1[0]);
        };
      } else {
        res.status(404).send('not found');
      };
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async post_email(req, res) {
    try {
      const { code, name, email } = req.body;
      let result1 = await this.knex("voucher")
      .innerJoin("discount","discount._id","voucher.discount_id")
      .where({ code });
      let result2 = await this.knex("voucher")
      .innerJoin("gift","gift._id","voucher.gift_id")
      .where({ code });
      let result = [...result1, ...result2];
      if (result[0]) {
        let message = '';
        message = result[0].balance ? `Gift Card with Balance: $${result[0].balance}` : message;
        message = result[0].amount_off ? `One-time Amount Off: $${result[0].amount_off} Coupon` : message;
        message = result[0].percent_off ? `${result[0].percent_off}% Discount Coupon` : message;
        message = result[0].amount_minimum ? `${message} (Minimum order $${result[0].amount_minimum})` : message;
        message = result[0].unit_type ? `${result[0].unit_type} Waiver Coupon` : message;
        let expiry = result[0].expiredAt ? `The coupon will be expired at ${new Date(result[0].expiredAt).toLocaleString()}` : "";
        let html = [];
        for (let i = 0; i < name.length; i++) {
          html.push(`<div style="margin:.5rem;text-align: center;">
          <div style="display: inline-block;">
    
          <a target="_blank" href="${process.env.REACT_FRONTEND}"
              style="display:inline-flex;text-decoration: none;font-size: 1.1rem;color: black;">
              <img src="${process.env.REACT_FRONTEND}/static/media/logoMealkit.d54da333.svg"
                  style="width:5rem;font-size:1.5rem;">
              <h1>MEALKIT</h1></img>
          </a>
          <br>
          <h3>Love to see you again!</h3>
          <br>
          <p style="color:#777;font-size: 1.1rem;margin-left: 25%;
          margin-right: 25%;">Hi ${name[i]}, we have prepared for a ${message}
              specially for you.
              Please use the code below when you place a new order.</p>
          <h1>${code}</h1>
          <p style="color:#777;font-size: 1.1rem;margin-left: 25%;
          margin-right: 25%;">${expiry}</p>
              <p>This email is auto-generated. Please do not reply to this email. You can contact us at
              <a target="_blank" href="${process.env.REACT_FRONTEND}">
              ${process.env.REACT_FRONTEND}
              </a>
              </p>
          </div>
          </div>
            `);
        };
        let mailOptions = {
          from: "no.reply_meal.kit@gmail.com",
          subject: `${message} From MealKit`,
        };
        for (let i = 0; i < email.length; i++) {
          mailOptions.to = email[i];
          mailOptions.html = html[i];
          let info = await this.transporter.sendMail(mailOptions);
        };
        this.transporter.close();
        res.send({ message: "done" });
      } else {
        res.status(404).send({message: 'not found'});
        return;
      };
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async post_welcome(req, res) {
    try {
      let code = voucher_codes.generate({ length: 8, count: 1,
        charset: "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ" })[0];
      let type = "DISCOUNT_VOUCHER";
      // let type = "GIFT_VOUCHER";
      let discount_type = "PERCENT";
      // let discount_type = "AMOUNT";
      // let discount_type = "UNIT";
      let percent_off = 30;
      let amount_minimum = null;
      let amount_off = null;
      let unit_off = null;
      let unit_type = null;
      let amount = null;
      let balance = null;
      let redeemable_qty = 1;
      let expiredAt = null;
      // let newGift = {amount, balance};
      // await this.knex.raw('SELECT setval(\'"gift__id_seq"\', (SELECT MAX(_id) from "gift"));');
      // let temp1 = await this.knex('gift').insert(newGift).returning("_id");
      // let gift_id = temp1[0];
      let newDiscount = {discount_type, percent_off, amount_minimum, amount_off, unit_off, unit_type};
      await this.knex.raw('SELECT setval(\'"discount__id_seq"\', (SELECT MAX(_id) from "discount"));');
      let temp2 = await this.knex('discount').insert(newDiscount).returning("_id");
      let discount_id = temp2[0];
      let newVoucher = {code, type, redeemable_qty, redeemed_qty: 0, active: true, published: false, expiredAt};
      if (discount_id > 0) {newVoucher = {...newVoucher, discount_id}};
      // if (gift_id > 0) {newVoucher = {...newVoucher, gift_id}};
      await this.knex.raw('SELECT setval(\'"voucher__id_seq"\', (SELECT MAX(_id) from "voucher"));');
      let _id = await this.knex('voucher').insert(newVoucher).returning("_id");
      newVoucher._id = _id[0];
      if (discount_id > 0) {newVoucher.discount = {...newDiscount}};
      // if (gift_id > 0) {newVoucher.gift = {...newGift}};
      let mailOptions = {
        from: "no.reply_meal.kit@gmail.com",
        to: req.user.email,
        subject: `A Welcome Gift From MealKit`,
        html: `<div style="margin:.5rem;text-align: center;">
      <div style="display: inline-block;">

      <a target="_blank" href="${process.env.REACT_FRONTEND}"
          style="display:inline-flex;text-decoration: none;font-size: 1.1rem;color: black;">
          <img src="${process.env.REACT_FRONTEND}/static/media/logoMealkit.d54da333.svg"
              style="width:5rem;font-size:1.5rem;">
          <h1>MEALKIT</h1></img>
      </a>
      <br>
      <h3>Thank you for your registration!</h3>
      <br>
      <p style="color:#777;font-size: 1.1rem;margin-left: 25%;
      margin-right: 25%;">Hi ${req.user.name}, we have prepared for a 30% discount coupon
          specially for you.
          Please use the code below when you place a new order.</p>
      <h1>${code}</h1>
          <p>This email is auto-generated. Please do not reply to this email. You can contact us at
          <a target="_blank" href="${process.env.REACT_FRONTEND}">
          ${process.env.REACT_FRONTEND}
          </a>
          </p>
      </div>
      </div>
        `,
      };
      this.transporter.sendMail(mailOptions, (error, response) => {
          if (error) {
            res.send(error);
          } else {
            res.send(mailOptions);
          }
          this.transporter.close();
        });
      res.send({ code });
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async get(req, res) {
    try {
      let result1 = await this.knex("voucher").orderBy('updatedAt', 'desc');
      let result2 = await this.knex("discount");
      let result3 = await this.knex("gift");
      let result4 = await this.knex("redemption").join("order","order._id","redemption.order_id");
      for (let i = 0; i < result1.length; i++) {
        result1[i].discount = null;
        for (let j = 0; j < result2.length; j++) {
          if (result2[j]._id === result1[i].discount_id) {
            result1[i].discount = result2[j];
          };
        };
        result1[i].gift = null;
        for (let k = 0; k < result3.length; k++) {
          if (result3[k]._id === result1[i].gift_id) {
            result1[i].gift = result3[k];
          };
        };
        result1[i].redemption = [];
        for (let l = 0; l < result4.length; l++) {
          if (result4[l].voucher_id === result1[i]._id) {
            let order = await this.knex("order").where({_id: Number(result4[l].order_id)});
            let order_items = await this.knex("order_item").where({order_id: Number(result4[l].order_id)});
            let payments = await this.knex("payment").where({order_id: Number(result4[l].order_id)});
            let user = await this.knex("user").where({_id: Number(order[0].user)}).column('name','email');
            let shipments = await this.knex("shipment").where({_id: Number(order[0].shipment_id)});
            let shipping_prices = await this.knex("shippingprice").where({_id: Number(order[0].shippingprice_id)});
            let payload = {...order[0], orderItems: order_items, shippingPrice: shipping_prices[0].shippingfee,
                shipping:{...shipments[0]}, payment:{...payments[0]}, user:{...user[0]}};
            result1[i].redemption.push(payload);
          };
        };
      };
      res.send(result1);
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async post(req, res) {
    try {
      let { code, type, 
        discount_type, percent_off, amount_minimum, amount_off, unit_off, unit_type,
        balance, 
        redeemable_qty, expiredAt } = req.body;
      if (code) {
        let result = await this.knex("voucher").where({ code });
        if (result[0]) {
          res.status(409).send({ message: "Code already exist."});
          return;
        };
      } else { code = voucher_codes.generate({ length: 8, count: 1,
      charset: "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ" })[0]; };
      let discount_id = -1;
      let gift_id = -1;
      let newGift = {};
      let newDiscount = {};
      if ((type === "GIFT_VOUCHER") && balance) {
        newGift = {amount: balance, balance};
        await this.knex.raw('SELECT setval(\'"gift__id_seq"\', (SELECT MAX(_id) from "gift"));');
        let temp1 = await this.knex('gift').insert(newGift).returning("_id");
        gift_id = temp1[0];
      } else if ((discount_type === "AMOUNT") && amount_off) {
        newDiscount = {discount_type, amount_off};
        await this.knex.raw('SELECT setval(\'"discount__id_seq"\', (SELECT MAX(_id) from "discount"));');
        let temp1 = await this.knex('discount').insert(newDiscount).returning("_id");
        discount_id = temp1[0];
      } else if ((discount_type === "PERCENT") && percent_off) {
        newDiscount = {discount_type, percent_off, amount_minimum};
        await this.knex.raw('SELECT setval(\'"discount__id_seq"\', (SELECT MAX(_id) from "discount"));');
        let temp1 = await this.knex('discount').insert(newDiscount).returning("_id");
        discount_id = temp1[0];
      } else if ((discount_type === "UNIT") && unit_off && unit_type) {
        newDiscount = {discount_type, unit_off, unit_type};
        await this.knex.raw('SELECT setval(\'"discount__id_seq"\', (SELECT MAX(_id) from "discount"));');
        let temp1 = await this.knex('discount').insert(newDiscount).returning("_id");
        discount_id = temp1[0];
      } else {
        res.status(403).send({ message: "Parameter missing."});
        return;
      };
      let newVoucher = {code, type, redeemable_qty, redeemed_qty: 0, active: true, published: false, expiredAt};
      if (discount_id > 0) {newVoucher = {...newVoucher, discount_id}};
      if (gift_id > 0) {newVoucher = {...newVoucher, gift_id}};
      await this.knex.raw('SELECT setval(\'"voucher__id_seq"\', (SELECT MAX(_id) from "voucher"));');
      let _id = await this.knex('voucher').insert(newVoucher).returning("_id");
      newVoucher._id = _id[0];
      if (discount_id > 0) {newVoucher.discount = {...newDiscount}};
      if (gift_id > 0) {newVoucher.gift = {...newGift}};
      res.send(newVoucher);
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
  async put_id(req, res) {
    try {
      const _id = Number(req.params.id);
      let { code, type, 
        discount_type, percent_off, amount_minimum, amount_off, unit_off, unit_type,
        amount, balance, active, published, 
        redeemable_qty, expiredAt } = req.body;
      if (code) {
        let result = await this.knex("voucher").where({ code });
        if (result[0] && (result[0]._id !== _id)) {
          res.status(409).send({ message: "Code already exist."});
          return;
        };
      } else { code = voucher_codes.generate({ length: 8, count: 1,
      charset: "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ" })[0]; };
      let temp1 = await this.knex("voucher").where({ _id }).returning("discount_id, gift_id");
      let discount_id = temp1[0].discount_id;
      let gift_id = temp1[0].gift_id;
      let newGift = {};
      let newDiscount = {};
      if ( gift_id ) {
        newGift = {amount, balance};
        await this.knex('gift').update(newGift).where({ _id: gift_id });
      } else if ((discount_type === "AMOUNT") && amount_off) {
        newDiscount = {discount_type, amount_off};
        await this.knex('discount').update(newDiscount).where({ _id: discount_id });
      } else if ((discount_type === "PERCENT") && percent_off) {
        newDiscount = {discount_type, percent_off, amount_minimum};
        await this.knex('discount').update(newDiscount).where({ _id: discount_id });
      } else if ((discount_type === "UNIT") && unit_off && unit_type) {
        newDiscount = {discount_type, unit_off, unit_type};
        await this.knex('discount').update(newDiscount).where({ _id: discount_id });
      } else {
        res.status(403).send({ message: "Parameter missing."});
        return;
      };
      let newVoucher = {code, type, redeemable_qty, active, published, expiredAt};
      if (discount_id > 0) {newVoucher = {...newVoucher, discount_id}};
      if (gift_id > 0) {newVoucher = {...newVoucher, gift_id}};
      await this.knex('voucher').update(newVoucher).where({ _id });
      newVoucher._id = _id;
      if (discount_id > 0) {newVoucher.discount = {...newDiscount}};
      if (gift_id > 0) {newVoucher.gift = {...newGift}};
      res.send(newVoucher);
    } catch (error) {
      console.log(error);
      res.status(401).send({ message: error.message });
    };
  };
};

module.exports = VoucherRouter;