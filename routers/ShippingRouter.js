const express = require("express");
const { isAuth } = require('../util');
require('dotenv').config();

class ShippingRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
        router.post("/", isAuth, this.post.bind(this));
        router.get("/", isAuth, this.get.bind(this));
        router.get("/area", this.get_area.bind(this));
        router.delete("/:id", isAuth, this.delete.bind(this));
        return router;
  };
  async get_area(req, res) {
    try {
      let result = null;
      switch (req.query.region) {
        case "HK Island":
           result = await this.knex('area').where({ region: "HK Island" });
          res.status(200).send(result.map(x => x.district));
          break;
          case "Kowloon":
          result = await this.knex('area').where({ region: "Kowloon" });
            res.status(200).send(result.map(x => x.district));
          break;
          case "NT":
          result = await this.knex('area').where({ region: "NT" });
            res.status(200).send(result.map(x => x.district));
            break;
        default:
          res.status(200).send([]);
        }
    } catch (error) {
      console.log(error)
      res.status(401).send({ message: error.message });
      }

    }

    async post(req, res) {
        try {
            const newShipping = {...req.body, user_id: req.user._id};
            await this.knex.raw('SELECT setval(\'"shipping__id_seq"\', (SELECT MAX(_id) from "shipping"));');
            let id = await this.knex('shipping').insert(newShipping).returning("_id");
            res.status(201).send({ message: "New Address Created", data: {...newShipping, _id: id} });
      } catch (error) {
        console.log(error);
        res.status(401).send({ message: error.message });
      }
    };
    async get(req, res) {
        try {
          let shippings = await this.knex("shipping").where({user_id: req.user._id})
          .returning("_id","user_id","address","area","city","country","latitude","longitude");
          if (shippings[0]) {
            res.status(201).send(shippings);
          } else {
            res.status(404).send({ message: 'No Address Found.' })
          }
        } catch (error) {
          res.status(400).send({ error });
        }
    };
    async delete(req, res) {
        try {
            const deletedShipping = await this.knex("shipping")
            .where({_id: req.params.id}).del();
            if (deletedShipping) {
                res.send({ message: 'Address Deleted' });
            } else {
                res.status(404).send({ message: 'Address Already Removed' });
            }
        } catch (err) {
          console.log(err);
            res.send('Error in Deletion.');
        }
    };
};

module.exports = ShippingRouter;