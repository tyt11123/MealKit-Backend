const express = require("express");
const { isAuth, isAdmin } = require('../util');

class DashboardRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
        router.get("/ordersPerDay", isAuth, isAdmin, this.get_orders_per_day.bind(this));
        router.get("/anonymousOrdersPerDay", isAuth, isAdmin, this.get_anonymous_orders_per_day.bind(this));
        router.get("/itemsPerDay", isAuth, isAdmin, this.get_items_per_day.bind(this));
        router.get("/salesPerDay", isAuth, isAdmin, this.get_sales_per_day.bind(this));
        router.get("/newUserPerDay", isAuth, isAdmin, this.get_new_user_per_day.bind(this));
        router.get("/newFacebookUserPerDay", isAuth, isAdmin, this.get_new_facebook_user_per_day.bind(this));
        router.get("/itemsPerOrder", isAuth, isAdmin, this.get_items_per_order.bind(this));
        router.get("/numberPerItem", isAuth, isAdmin, this.get_number_per_item.bind(this));
        router.get("/", isAuth, isAdmin, this.get.bind(this));
        return router;
  };
  async get(req, res) {
      let answer = [
          {text: "Number of Paid Order over the Last 10 Days", value: "ordersPerDay", },
          {text: "Number of Anonymous Users that Paid over the Last 10 Days", value: "anonymousOrdersPerDay", },
          {text: "Number of Items Sold Over the Last 10 Days", value: "itemsPerDay", },
          {text: "Sales over the Last 10 Days", value: "salesPerDay", },
          {text: "Number of Users Registered over the Last 10 Days", value: "newUserPerDay", },
          {text: "Number of Facebook Users Registered over the Last 10 Days", value: "newFacebookUserPerDay", },
          {text: "Number of Orders Versus Number of Items Ordered", value: "itemsPerOrder", },
          {text: "Number of Times Ordered For Each Item", value: "numberPerItem", },
      ];
      res.send(answer);
  };
  async get_orders_per_day(req, res) {
    try {
        let earlier = new Date();
        let latter = new Date();
        earlier.setHours(0,0,0,0);
        latter.setHours(0,0,0,0);
        latter.setDate(latter.getDate() + 1);
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "Number of Paid Orders Over the Last 10 Days",
                },
                type: "line",
            },
            seriesFromBackend: [{
                name: "Count",
                data: [],
            }],
        };
        for (let i = 0; i < 10; i++) {
            let result = await this.knex("order").count('_id').where("paidAt",">=",earlier).andWhere("paidAt","<=",latter);
            answer.seriesFromBackend[0].data.unshift(Number(result[0].count));
            answer.optionsFromBackend.xaxis.categories.unshift(new Date(earlier));
            earlier.setDate(earlier.getDate() - 1);
            latter.setDate(latter.getDate() - 1);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_anonymous_orders_per_day(req, res) {
    try {
        let earlier = new Date();
        let latter = new Date();
        earlier.setHours(0,0,0,0);
        latter.setHours(0,0,0,0);
        latter.setDate(latter.getDate() + 1);
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "Number of Non-Member Customers Over the Last 10 Days",
                },
                type: "bar",
            },
            seriesFromBackend: [{
                name: "Count",
                data: [],
            }],
        };
        for (let i = 0; i < 10; i++) {
            let result = await this.knex("order").count('anonymous_user').where("paidAt",">=",earlier).andWhere("paidAt","<=",latter);
            answer.seriesFromBackend[0].data.unshift(Number(result[0].count));
            answer.optionsFromBackend.xaxis.categories.unshift(new Date(earlier));
            earlier.setDate(earlier.getDate() - 1);
            latter.setDate(latter.getDate() - 1);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_items_per_day(req, res) {
    try {
        let earlier = new Date();
        let latter = new Date();
        earlier.setHours(0,0,0,0);
        latter.setHours(0,0,0,0);
        latter.setDate(latter.getDate() + 1);
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "Number of Items Ordered Over the Last 10 Days",
                },
                type: "bar",
            },
            seriesFromBackend: [{
                name: "Count",
                data: [],
            }],
        };
        for (let i = 0; i < 10; i++) {
            let result = await this.knex("order").column('_id').where("paidAt",">=",earlier).andWhere("paidAt","<=",latter);
            let temp1 = result.map(x=>x._id);
            let count = 0;
            for (let j = 0; j < temp1.length; j++) {
                let result2 = await this.knex("order_item").count("_id").where("order_id",temp1[j]);
                count += Number(result2[0].count);
            };
            answer.seriesFromBackend[0].data.unshift(count);
            answer.optionsFromBackend.xaxis.categories.unshift(new Date(earlier));
            earlier.setDate(earlier.getDate() - 1);
            latter.setDate(latter.getDate() - 1);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_sales_per_day(req, res) {
    try {
        let earlier = new Date();
        let latter = new Date();
        earlier.setHours(0,0,0,0);
        latter.setHours(0,0,0,0);
        latter.setDate(latter.getDate() + 1);
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "Sales Over the Last 10 Days",
                },
                type: "bar",
            },
            seriesFromBackend: [{
                name: "Sales",
                data: [],
            }],
        };
        for (let i = 0; i < 10; i++) {
            let result = await this.knex("order").sum('totalPrice').where("paidAt",">=",earlier).andWhere("paidAt","<=",latter);
            answer.seriesFromBackend[0].data.unshift(Number(result[0].sum));
            answer.optionsFromBackend.xaxis.categories.unshift(new Date(earlier));
            earlier.setDate(earlier.getDate() - 1);
            latter.setDate(latter.getDate() - 1);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_new_user_per_day(req, res) {
    try {
        let earlier = new Date();
        let latter = new Date();
        earlier.setHours(0,0,0,0);
        latter.setHours(0,0,0,0);
        latter.setDate(latter.getDate() + 1);
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "New User Registrations Over the Last 10 Days",
                },
                type: "bar",
            },
            seriesFromBackend: [{
                name: "Count",
                data: [],
            }],
        };
        for (let i = 0; i < 10; i++) {
            let result = await this.knex("user").count('_id').where("createdAt",">=",earlier).andWhere("createdAt","<=",latter);
            answer.seriesFromBackend[0].data.unshift(Number(result[0].count));
            answer.optionsFromBackend.xaxis.categories.unshift(new Date(earlier));
            earlier.setDate(earlier.getDate() - 1);
            latter.setDate(latter.getDate() - 1);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_new_facebook_user_per_day(req, res) {
    try {
        let earlier = new Date();
        let latter = new Date();
        earlier.setHours(0,0,0,0);
        latter.setHours(0,0,0,0);
        latter.setDate(latter.getDate() + 1);
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "New Facebook Registrations Over the Last 10 Days",
                },
                type: "bar",
            },
            seriesFromBackend: [{
                name: "Count",
                data: [],
            }],
        };
        for (let i = 0; i < 10; i++) {
            let result = await this.knex("facebook_user").count('_id').where("createdAt",">=",earlier).andWhere("createdAt","<=",latter);
            answer.seriesFromBackend[0].data.unshift(Number(result[0].count));
            answer.optionsFromBackend.xaxis.categories.unshift(new Date(earlier));
            earlier.setDate(earlier.getDate() - 1);
            latter.setDate(latter.getDate() - 1);
        };
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_items_per_order(req, res) {
    try {
        let result = await this.knex.with('a', this.knex("order_item").column("order_id").sum("qty as quantity").groupBy("order_id")).column("quantity").count("quantity").groupBy("quantity").orderBy("quantity").from("a");
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "Number of Orders Versus Number of Items Ordered",
                },
                type: "bar",
            },
            seriesFromBackend: [{
                name: "Count",
                data: [],
            }],
        };
        answer.optionsFromBackend.xaxis.categories = result.map(x=>"Order with "+x.quantity+" item");
        answer.seriesFromBackend[0].data = result.map(x=>Number(x.count));
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
  async get_number_per_item(req, res) {
    try {
        let result = await this.knex("order_item").rightJoin("product","order_item.product","product._id").column("product.name").sum("qty").groupBy("product._id").orderBy("product.updatedAt","desc");
        let answer = {
            optionsFromBackend: {
                xaxis: {
                    categories: [],
                },
                title: {
                    text: "Number of Times Ordered For Each Item",
                },
                type: "bar",
            },
            seriesFromBackend: [{
                name: "Number of Times",
                data: [],
            }],
        };
        answer.optionsFromBackend.xaxis.categories = result.map(x=>"\"" + x.name + "\"");
        answer.seriesFromBackend[0].data = result.map(x=>x.sum ? Number(x.sum) : 0);
        res.send(answer);
    } catch (error) {
        res.status(401).send({ message: error.message });
    };
  };
};


module.exports = DashboardRouter;