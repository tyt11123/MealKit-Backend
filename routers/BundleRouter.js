const express = require("express");
const { isAuth, isAdmin } = require('../util');

class BundleRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
        router.get("/", this.get.bind(this));
        router.post("/", isAuth, isAdmin, this.post.bind(this));
        return router;
  };
  async get(req, res) {
    try {
        let result = await this.knex("priceplan");
        let ans = {bulkQty: result.map(x=>x.qty), 
            bulkAmount: result.map(x=>x.bundle_price), 
            bulkCeiling: result.map(x=>x.ceiling), };
        res.send(ans);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async post(req, res) {
    try {
        let { bulkQty, bulkAmount, bulkCeiling } = req.body;
        let result = await this.knex("priceplan");
        let flag1 = [];
        for (let i = 0; i < result.length; i++) {flag1.push(false);};
        let flag2 = [];
        for (let i = 0; i < bulkQty.length; i++) {flag2.push(false);};
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < bulkQty.length; j++) {
                if (result[i].qty === bulkQty[j]) {
                    flag1[i] = true;
                    flag2[j] = true;
                };
            };
        };
        for (let i = 0; i < result.length; i++) {
            if (flag1[i] === false) {
                await this.knex('priceplan').where({_id:result[i]._id}).del();
            };
        };
        for (let i = 0; i < bulkQty.length; i++) {
            if (flag2[i]) {
                await this.knex('priceplan').where({qty:bulkQty[i]})
                .update({bundle_price:bulkAmount[i], ceiling:bulkCeiling[i]});
            } else {
                await this.knex.raw('SELECT setval(\'"priceplan__id_seq"\', (SELECT MAX(_id) from "priceplan"));');
                await this.knex('priceplan').insert({qty:bulkQty[i],bundle_price:bulkAmount[i],ceiling:bulkCeiling[i]});
            };
        };
        res.send("done");
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
};

module.exports = BundleRouter;