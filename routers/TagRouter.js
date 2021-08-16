const express = require("express");
const { isAuth } = require('../util');

class TagRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
        router.get("/category", this.get_category.bind(this));
        router.get("/allergy", this.get_allergy.bind(this));
        router.get("/type", this.get_type.bind(this));
        return router;
  };
  async get_category(req, res) {
    try {
      let result = await this.knex("productcategory").column("name");
      // let payload = [];
      // for (let i = 0; i < result.length; i++ ) {
      //   let item = {};
      //   item.value = result[i].name;
      //   item.label = result[i].name;
      //   payload.push(item);
      // };
      // res.send(payload);
      res.send(result.map(x=>x.name));
    } catch (error) {
      res.status(401).send({ message: error.message });
      };
    };
  async get_allergy(req, res) {
    try {
      let result = await this.knex("allergy").column("name");
      // let payload = [];
      // for (let i = 0; i < result.length; i++ ) {
      //   let item = {};
      //   item.value = result[i].name;
      //   item.label = result[i].name;
      //   payload.push(item);
      // };
      // res.send(payload);
      res.send(result.map(x=>x.name));
    } catch (error) {
      res.status(401).send({ message: error.message });
      };
    };
  async get_type(req, res) {
    try {
      let result = await this.knex("producttype").column("_id","name");
      let payload = [];
      for (let i = 0; i < result.length; i++ ) {
        let item = {};
        item.name = result[i].name;
        let result2 = await this.knex("product").column("image").where({ type: result[i]._id });
        let temp1 = JSON.parse(result2[Math.floor(Math.random() * result2.length)].image);
        item.image = temp1[0];
        payload.push(item);
      };
      res.send(payload);
    } catch (error) {
      res.status(401).send({ message: error.message });
      };
    };
};

module.exports = TagRouter;