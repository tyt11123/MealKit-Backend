const express = require("express");
const { isAdmin, isAuth, getAuth, } = require('../util');
const axios = require("axios");
const jwt = require('jsonwebtoken');
const config = require('../config');

class ProductRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();

        router.get("/createsample/:id", isAuth, isAdmin, this.createsample.bind(this));
        router.get("/", this.get.bind(this));
        router.get("/menu", this.get_menu.bind(this));
        router.get("/landingpage", isAuth, isAdmin, this.get_landingpage.bind(this));
        router.get("/:id", this.get_id.bind(this));
        router.post("/:id/reviews", isAuth, this.post_id_reviews.bind(this));
        router.put("/landingpage", isAuth, isAdmin, this.put_landingpage.bind(this));
        router.put("/:id", isAuth, isAdmin, this.put_id.bind(this));
        router.delete("/:id", isAuth, isAdmin, this.delete_id.bind(this));
        router.post("/", isAuth, isAdmin, this.post.bind(this));
        console.log("In the router");
    
        return router;
    };
    async get(req, res) {
        let queryCategory = req.query.category.split(',');
        const categories = await this.knex("productcategory");
        let queryType = req.query.type.split(',');
        const types = await this.knex("producttype");
        let category = [];
        for (let i = 0; i < categories.length; i++) {
            for (let j = 0; j < queryCategory.length; j++) {
                if (queryCategory[j] == categories[i].name) {
                    category.push(categories[i]._id);
                };
            };
        };
        if (category.length === 0) {category = categories.map(x=>x._id)};
        let type = [];
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < queryType.length; j++) {
                if (queryType[j] == types[i].name) {
                    type.push(types[i]._id);
                };
            };
        };
        if (type.length === 0) {type = types.map(x=>x._id)};
        const sortOrder = req.query.sortOrder === 'Lowest'
            ? [{ column: "price"}] : req.query.sortOrder === 'Highest' ?
            [{ column: "price", order: "desc" }]
          : [{ column: "_id", order: "desc" }];
        const productIDs = await this.knex('product_category').whereIn("productcategory_id",category);
        const id_array = productIDs.map(x=>x.product_id);
        const products = req.query.searchKeyword
        ? await this.knex('product').whereIn("type",type).whereIn("_id",id_array).andWhere("name","ILIKE",`%${req.query.searchKeyword}%`).orderBy(sortOrder)
        : await this.knex('product').whereIn("type",type).whereIn("_id",id_array).orderBy(sortOrder);
        const reviews = await this.knex("review").orderBy("_id","desc");
        const user = getAuth(req);
        const favouriteQuery = user ? 
        (Number(user._id) > 10000000) ?
        await this.knex("user_product").where({facebook_user_id: user._id}):
        await this.knex("user_product").where({user_id: user._id}): [];
        for (let i = 0; i < products.length; i++) {
            products[i].image = JSON.parse(products[i].image);
            products[i].reviews = [];
            for (let j = 0; j < reviews.length; j++) {
                if (products[i]._id === reviews[j].product_id) {
                    products[i].reviews.push(reviews[j]);
                }
            }
            products[i].favourite = false;
            for (let m = 0; m < favouriteQuery.length; m++) {
                if (products[i]._id === favouriteQuery[m].product_id) {
                    products[i].favourite = true;
                };
            };
            products[i].category = [];
            for (let k = 0; k < productIDs.length; k++) {
                if (products[i]._id === productIDs[k].product_id) {
                    for (let m = 0; m < categories.length; m++ ) {
                        if (productIDs[k].productcategory_id === categories[m]._id) {
                            products[i].category.push(categories[m].name);
                        }
                    }
                }
            }
            for (let l = 0; l < types.length; l++) {
                if (products[i].type === types[l]._id) {
                    products[i].type = types[l].name;
                }
            }
        }
        res.send(products);
    };
    async get_menu(req, res) {
        try {
            const product = await this.knex("product").where({landingPage: true}).column("_id","name","image");
            for (let i = 0; i < product.length; i++) {
                product[i].image = JSON.parse(product[i].image);
            };
            res.send(product);
        } catch (error) {
            res.status(401).send({message: error.message});
        };
    };
    async get_landingpage(req, res) {
        try {
            const product = await this.knex("product").column("_id","name","image","landingPage").orderBy("landingPage","desc");
            for (let i = 0; i < product.length; i++) {
                product[i].image = JSON.parse(product[i].image);
            };
            res.send(product);
        } catch (error) {
            res.status(401).send({message: error.message});
        };
    };
    async get_id(req, res) {
        const product = await this.knex("product")
        .where({_id: req.params.id});
        const reviews = await this.knex("review")
        .where({product_id: req.params.id})
        .column("_id","name","rating","comment","createdAt","updatedAt");
        const user = getAuth(req);
        const favouriteQuery = user ? 
        (Number(user._id) > 10000000) ?
        await this.knex("user_product").where({facebook_user_id: user._id, product_id: req.params.id}):
        await this.knex("user_product").where({user_id: user._id, product_id: req.params.id}): [];
        const favourite = Boolean(favouriteQuery[0]);
        if (product[0]) {
            product[0].image = JSON.parse(product[0].image);
            let query1 = await this.knex('product_category').where({product_id:req.params.id});
            let categoryIDs = query1.map(x=>x.productcategory_id);
            const categories = await this.knex("productcategory").whereIn("_id",categoryIDs);
            const types = await this.knex("producttype").where({_id:product[0].type});
            const payload = {...product[0], reviews: reviews, category: categories.map(x=>x.name), 
                type: types[0].name, favourite };
            res.send(payload);
        } else {
            res.status(404).send({ message: 'Product Not Found.' });
        }
    };
    async post_id_reviews(req,res) {
        const product = await this.knex("product")
        .where({_id: req.params.id});
        if (product[0]) {
            try {
                const review = {
                    product_id: req.params.id,
                    name: req.body.name,
                    rating: Number(req.body.rating),
                    comment: req.body.comment,
                };
                await this.knex.raw('SELECT setval(\'"review__id_seq"\', (SELECT MAX(_id) from "review"));');
                let result = await this.knex('review').insert(review).returning('_id');
                if (result[0]) {
                    let temp1 = await this.knex('review').where({_id:result[0]});
                    const payload = {
                        data: temp1[0],
                        message: 'Review saved successfully.',
                    };
                    delete payload.data.product_id;
                    let length = await this.knex('review').where({product_id: req.params.id}).count('_id as a');
                    let numReviews = Number(length[0].a);
                    let rating = Number(product[0].rating) * Number(product[0].numReviews) + Number(req.body.rating);
                    rating = rating / numReviews;
                    await this.knex('product').where({_id: req.params.id})
                    .update({numReviews: numReviews, rating: rating.toFixed(2),});
                    res.status(201).send(payload);
                }
            }
            catch (error) {
                res.status(401).send({ message: error.message });
            };
        } else {
            res.status(404).send({ message: 'Product Not Found' });
        };
    };
    async put_landingpage(req, res) {
        try {
            let a = await this.knex("product").count("_id");
            let count = Number(a[0].count);
            let { products } = req.body;
            if ( count === products.length ) {
                for (let i = 0; i < count; i++) {
                    await this.knex("product").where({_id: products[i]._id}).update({landingPage: products[i].landingPage});
                };
                res.send("Done");
            } else {
                res.status(409).send("Unmatch payload");
            }
        } catch (error) {
            res.status(401).send({ message: error.message });
        };
    };
    async put_id(req, res) {
        try {
        if (req.body.category) {
            for (let i = 0; i < req.body.category.length; i++) {
                const temp1 = await this.knex("productcategory")
                .where({name: req.body.category[i]});
                if (!(temp1[0])) {
                    await this.knex.raw('SELECT setval(\'"productcategory__id_seq"\', (SELECT MAX(_id) from "productcategory"));');
                    await this.knex('productcategory').insert({name: req.body.category[i]});
                };
            };
        };
        const temp2 = await this.knex("producttype")
        .where({name: req.body.type});
        let type = null;
        if (temp2[0]) {
            type = temp2[0]._id;
        } else {
            await this.knex.raw('SELECT setval(\'"producttype__id_seq"\', (SELECT MAX(_id) from "producttype"));');
            let result2 = await this.knex('producttype').insert({name: req.body.type}).returning('_id');
            type = result2[0];
        };
        const product = await this.knex("product")
        .where({_id: req.params.id});
        if (product[0]) {
            let query1 = await this.knex('product_category').where('product_id',req.params.id);
            let flag1 = [];
            for (let i = 0; i < query1.length; i++) {flag1.push(false);};
            let category = query1.map(x=>x.productcategory_id);
            let flag2 = [];
            if (req.body.category) {
                for (let i = 0; i < req.body.category.length; i++) {
                    flag2.push(false);
                    let query2 = await this.knex('productcategory').where('name',req.body.category[i]);
                    for (let j = 0; j < query1.length; j++) {
                        if (query2[0]._id === category[j]) {flag2[i] = true; flag1[j] = true;};
                    };
                };
            };
            for (let i = 0; i < query1.length; i++) {
                if (flag1[i] === false) {
                    await this.knex('product_category').where('_id',query1[i]._id).del();
                };
            };
            if (req.body.category) {
                for (let i = 0; i < req.body.category.length; i++) {
                    if (flag2[i] === false) {
                        let query3 = await this.knex('productcategory').where('name',req.body.category[i]); 
                        await this.knex.raw('SELECT setval(\'"product_category__id_seq"\', (SELECT MAX(_id) from "product_category"));');
                        await this.knex('product_category').insert({product_id: req.params.id, productcategory_id: query3[0]._id}); 
                    };
                };
            } else {
                let query3 = await this.knex('productcategory'); 
                for (let i = 0; i < query3.length; i++) {
                    await this.knex.raw('SELECT setval(\'"product_category__id_seq"\', (SELECT MAX(_id) from "product_category"));');
                    await this.knex('product_category').insert({product_id: req.params.id, productcategory_id: query3[i]._id}); 
                };
            };
            let payload = {
                price: req.body.price,
                image: JSON.stringify(req.body.image),
                calories:req.body.calories,
                type: type,
                // difficulty: req.body.difficulty,
                // c_time: req.body.c_time,
                // category: category,
                countInStock: req.body.countInStock,
                description: req.body.description,
                ingredient: req.body.ingredient,
                name: req.body.name,
            };
            let result1 = await this.knex("product").where({_id: req.params.id}).update(payload);
            if (result1) {
                const product1 = await this.knex("product")
                .where({_id: req.params.id});
                const reviews = await this.knex("review")
                .where({product_id: req.params.id})
                .column("_id","name","rating","comment","createdAt","updatedAt");
                if (product1[0]) {
                    const result2 = {...product1[0], reviews: reviews, type: req.body.type, category: req.body.category};
                    delete result2.createdAt;
                    delete result2.updatedAt;
                    res.status(200)
                    .send({ message: 'Product Updated', data: result2 });
                }
            };
        } else {
            res.status(500).send({ message: ' Error in Updating Product.' });
        };
        } catch (error) {
            res.send(error);
        };
    };
    async delete_id(req, res) {
        try {
            const deletedCategories = await this.knex("product_category")
            .where({product_id: req.params.id}).del();
            const deletedFavourite = await this.knex("user_product")
            .where({product_id: req.params.id}).del();
            const deletedProduct = await this.knex("product")
            .where({_id: req.params.id}).del();
            if (deletedProduct) {
                const deletedReview = await this.knex("review")
                .where({product_id: req.params.id}).del();
                res.send({ message: 'Product Deleted' });
            } else {
                res.status(404).send({ message: 'Product Already Removed' });
            }
        } catch (err) {
            res.status(401).send('Error in Deletion.');
        }
    };
    async post(req, res) {
        try {
            let category = [];
            if (req.body.category) {
                for (let i = 0; i < req.body.category.length; i++) {
                let temp1 = await this.knex("productcategory")
                .where({name: req.body.category[i]});
                
                if (temp1[0]) {
                    category.push(temp1[0]._id);
                } else {
                    await this.knex.raw('SELECT setval(\'"productcategory__id_seq"\', (SELECT MAX(_id) from "productcategory"));');
                    let result1 = await this.knex('productcategory').insert({name: req.body.category[i]}).returning('_id');
                    category.push(result1[0]);
                };
                };
            } else {
                let temp1 = await this.knex("productcategory").column('_id');
                category = temp1.map(x=>x._id);
            };

            const temp3 = await this.knex("producttype")
            .where({name: req.body.type});
            let type = null;
            if (temp3[0]) {
                type = temp3[0]._id;
            } else {
                await this.knex.raw('SELECT setval(\'"producttype__id_seq"\', (SELECT MAX(_id) from "producttype"));');
                let result3 = await this.knex('producttype').insert({name: req.body.type}).returning('_id');
                type = result3[0];
            };
            const newProduct = {
                name: req.body.name,
                price: req.body.price,
                image: JSON.stringify(req.body.image),
                calories: req.body.calories,
                type: type,
                difficulty: req.body.difficulty,
                c_time: req.body.c_time,
                // category: category,
                countInStock: req.body.countInStock,
                description: req.body.description || req.body.name,
                ingredient: req.body.ingredient,
                // rating: req.body.rating || 0,
                numReviews: req.body.numReviews || 0,
            };
            await this.knex.raw('SELECT setval(\'"product__id_seq"\', (SELECT MAX(_id) from "product"));');
            let result = await this.knex('product').insert(newProduct).returning('_id');
            if (result[0]) {
                for (let i = 0; i < category.length; i++) {
                    await this.knex.raw('SELECT setval(\'"product_category__id_seq"\', (SELECT MAX(_id) from "product_category"));');
                    await this.knex('product_category').insert({product_id: result[0], productcategory_id: category[i]});
                };
                res.status(201).send({
                    message: "New Product Created",
                    data: {...newProduct,
                    _id: result[0],
                    type: req.body.type,
                    category: req.body.category,
                    reviews: [],
                    },
                });
            } else {
                res.status(500).send({ message: ' Error in Creating Product.' });
            };
        }
        catch (error) {
            res.status(500).send({ message: ' Error in Creating Product.' });
            console.log(error)
        }
    };
    async createsample(req, res) {
        try {
            const temp1 = await this.knex("productcategory")
            .where({name: req.params.id});
            let category = null;
            if (temp1[0]) {
                category = temp1[0]._id;
            } else {
                await this.knex.raw('SELECT setval(\'"productcategory__id_seq"\', (SELECT MAX(_id) from "productcategory"));');
                let result1 = await this.knex('productcategory').insert({name: req.params.id}).returning('_id');
                category = result1[0];
            };
            const temp3 = await this.knex("producttype")
            .where({name: "Dish"});
            let type = null;
            if (temp3[0]) {
                type = temp3[0]._id;
            } else {
                await this.knex.raw('SELECT setval(\'"producttype__id_seq"\', (SELECT MAX(_id) from "producttype"));');
                let result2 = await this.knex('producttype').insert({name: "Dish"}).returning('_id');
                type = result2[0];
            };
            let result3 = await axios.get(`https://recipesapi.herokuapp.com/api/search?q=${req.params.id}`);
            let abc = [68, 78, 88, 98];
            let bcd = [620, 730, 870, 940, 1090];
            let cde = [15, 30, 45, 60];
            for (let i = 0; i < result3.data.recipes.length; i++) {
                let num1 = Math.floor(Math.random() * Math.floor(4)); // 0, 1, 2, 3
                let num2 = Math.floor(Math.random() * Math.floor(5)); // 0, 1, 2, 3, 4
                let num3 = Math.floor(Math.random() * Math.floor(5)) + 1; // 1, 2, 3, 4, 5
                let num4 = Math.floor(Math.random() * Math.floor(4)); // 0, 1, 2, 3
                let regex = /&amp;/gi;
                let title = result3.data.recipes[i].title.replace(regex, 'and');
                const newProduct = {
                    name: title,
                    price: abc[num1],
                    image: `["${result3.data.recipes[i].image_url}"]`,
                    calories: bcd[num2],
                    type: type,
                    difficulty: num3,
                    c_time: cde[num4],
                    countInStock: 10,
                    description: result3.data.recipes[i].source_url + "\n不設最低消費，另+$40可享送貨服務滿$300可享免費送貨服務 (只限【DIY 烘焙懶人包視頻教學】)（加配商品不算在內）\n想學製作甜品卻又不知道從何入手？要自己到處買材料卻發覺預算的份量不對？看不懂食譜最後弄了道地獄甜品出來，不好吃之餘還要賣相差不能打卡？ 日日煮全新推出的DIY烘焙懶人包，每個烘焙包都已經幫你準備好你需要的材料，份量和模具送到上你家，採用視頻形式一步一步教你製作，有字有畫零失手！試過就知道原來製作甜品也可以這麼簡單有趣，完成後更可以在家慢慢品嘗自己的傑作呢！",
                    ingredient: "1 Teaspoon of Salt\n鹽 1茶匙\n1 Teaspoon of Sugar\n糖 1茶匙\nWater 100ml\n水 100毫升",
                    // rating: req.body.rating || 0,
                    numReviews: 0,
                };
                await this.knex.raw('SELECT setval(\'"product__id_seq"\', (SELECT MAX(_id) from "product"));');
                let num5 = await this.knex('product').insert(newProduct).returning("_id");
                await this.knex.raw('SELECT setval(\'"product_category__id_seq"\', (SELECT MAX(_id) from "product_category"));');
                await this.knex('product_category').insert({product_id: num5[0], productcategory_id: category});
            };
            res.status(200).send({message: "New Products Created"});
        } catch (error) {
            res.status(500).send({error})
        }
    };
};

module.exports = ProductRouter;