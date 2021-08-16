const express = require("express");
const { isAuth, isAdmin } = require('../util');

class DayOffRouter {
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
        let result = await this.knex("dayoff");
        let ans = {bulkDate: result.map(x=>x.date)};
        res.send(ans);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async post(req, res) {
    try {
        let { bulkDate } = req.body;
        console.log(bulkDate);
        let result = await this.knex("dayoff");
        let flag1 = [];
        for (let i = 0; i < result.length; i++) {flag1.push(false);};
        let flag2 = [];
        for (let i = 0; i < bulkDate.length; i++) {flag2.push(false);};
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < bulkDate.length; j++) {
                if (new Date(result[i].date).valueOf() === new Date(bulkDate[j]).valueOf()) {
                    flag1[i] = true;
                    flag2[j] = true;
                };
            };
        };
        for (let i = 0; i < result.length; i++) {
            if (flag1[i] === false) {
                await this.knex('dayoff').where({_id:result[i]._id}).del();
            };
        };
        for (let i = 0; i < bulkDate.length; i++) {
            if (flag2[i] === false) {
                await this.knex.raw('SELECT setval(\'"dayoff__id_seq"\', (SELECT MAX(_id) from "dayoff"));');
                await this.knex('dayoff').insert({date:bulkDate[i]});
            };
        };
        res.send("done");
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
};

module.exports = DayOffRouter;