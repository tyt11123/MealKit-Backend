const express = require("express");
const { isAuth } = require('../util');

class RedeemRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
        router.post("/:code", this.post.bind(this));
        return router;
  };
  async post(req, res) {
    try {
      let { code } = req.params;
      let { amount, order_id } = req.body;
      let result1 = await this.knex("voucher")
      .innerJoin("discount","discount._id","voucher.discount_id")
      .where({ code });
      let result2 = await this.knex("voucher")
      .innerJoin("gift","gift._id","voucher.gift_id")
      .where({ code });
      let result = [...result1, ...result2];
      let valid = false;
      if ( result[0] ) {
        valid = result[0].active;
        if ( result[0].redeemable_qty ) {
          if ( result[0].redeemable_qty <= result[0].redeemed_qty ) {valid = false;};
        };
        if ( result[0].balance ) {
          if ( result[0].balance < amount ) {valid = false;};
        };
      };
      if (valid) {
        let temp1 = await this.knex("voucher").where({ code }).select("_id");
        let voucher_id = temp1[0]._id;
        const newRedemption = {voucher_id, order_id};
        await this.knex.raw('SELECT setval(\'"redemption__id_seq"\', (SELECT MAX(_id) from "redemption"));');
        let {_id} = await this.knex('redemption').insert(newRedemption).returning("_id");
        await this.knex('voucher').where({ code }).increment("redeemed_qty", 1);
        if ( result[0].balance ) {
          await this.knex('gift').where({ _id: result[0].gift_id }).decrement("balance", amount);
        };
        res.send({ _id, newRedemption });
      } else {
        res.status(403).send({ message: "Forbidden"});
      };
    } catch (error) {
      res.status(401).send({ message: error.message });
    };
  };
};

module.exports = RedeemRouter;