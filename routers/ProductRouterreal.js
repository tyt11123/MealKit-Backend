const express = require("express");
const { isAdmin, isAuth } = require('../util');

class ProductRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
    
        router.get("/", this.get.bind(this));
        router.get("/:id", this.get_id.bind(this));
        router.post("/:id/reviews", isAuth, this.post_id_reviews.bind(this));
        router.put("/:id", isAuth, isAdmin, this.put_id.bind(this));
        router.delete("/:id", isAuth, isAdmin, this.delete_id.bind(this));
        router.post("/", isAuth, isAdmin, this.post.bind(this));
        console.log("In the router");
    
        return router;
    };
    async get(req, res) {
        const categories = await this.knex("productcategory");
        const brands = await this.knex("productbrand");
        let category = {};
        for (let i = 0; i < categories.length; i++) {
            if (req.query.category == categories[i].name) {
                category = {category:categories[i]._id};
            };
        };
        const sortOrder = req.query.sortOrder
          ? req.query.sortOrder === 'lowest'
            ? [{ column: "price"}]
            : [{ column: "price", order: "desc" }]
          : [{ column: "_id", order: "desc" }];
        const products = req.query.searchKeyword
        ? await this.knex('product').where(category).andWhere("name","ILIKE",req.query.searchKeyword).orderBy(sortOrder)
        : await this.knex('product').where(category).orderBy(sortOrder);
        const reviews = await this.knex("review").orderBy("_id","desc");
        for (let i = 0; i < products.length; i++) {
            products[i].reviews = [];
            for (let j = 0; j < reviews.length; j++) {
                if (products[i]._id === reviews[j].product_id) {
                    products[i].reviews.push(reviews[j]);
                }
            }
            for (let k = 0; k < categories.length; k++) {
                if (products[i].category === categories[k]._id) {
                    products[i].category = categories[k].name;
                }
            }
            for (let l = 0; l < brands.length; l++) {
                if (products[i].brand === brands[l]._id) {
                    products[i].brand = brands[l].name;
                }
            }
        }
        res.send(products);
    };
    async get_id(req, res) {
        const product = await this.knex("product")
        .where({_id: req.params.id});
        const reviews = await this.knex("review")
        .where({product_id: req.params.id})
        .column("_id","name","rating","comment","createdAt","updatedAt");
        if (product[0]) {
            const categories = await this.knex("productcategory").where({_id:product[0].category});
            const brands = await this.knex("productbrand").where({_id:product[0].brand});
            const payload = {...product[0], reviews: reviews, category: categories[0].name, brand: brands[0].name};
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
    async put_id(req, res) {
        const temp1 = await this.knex("productcategory")
        .where({name: req.body.category});
        let category = null;
        if (temp1[0]) {
            category = temp1[0]._id;
        } else {
            await this.knex.raw('SELECT setval(\'"productcategory__id_seq"\', (SELECT MAX(_id) from "productcategory"));');
            let result1 = await this.knex('productcategory').insert({name: req.body.category}).returning('_id');
            category = result1[0];
        };
        const temp2 = await this.knex("productbrand")
        .where({name: req.body.brand});
        let brand = null;
        if (temp2[0]) {
            brand = temp2[0]._id;
        } else {
            await this.knex.raw('SELECT setval(\'"productbrand__id_seq"\', (SELECT MAX(_id) from "productbrand"));');
            let result2 = await this.knex('productbrand').insert({name: req.body.brand}).returning('_id');
            brand = result2[0];
        };
        const product = await this.knex("product")
        .where({_id: req.params.id});
        if (product[0]) {
            try {
            let payload = {
                price: req.body.price,
                image: req.body.image,
                brand: brand,
                category: category,
                countInStock: req.body.countInStock,
                description: req.body.description,
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
                    const result2 = {...product1[0], reviews: reviews, brand: req.body.brand, category: req.body.category};
                    delete result2.createdAt;
                    delete result2.updatedAt;
                    res.status(200)
                    .send({ message: 'Product Updated', data: result2 });
                }
            };
            } catch (error) {
                res.send(error);
            };
        } else {
            res.status(500).send({ message: ' Error in Updating Product.' });
        }
    };
    async delete_id(req, res) {
        try {
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
            res.send('Error in Deletion.');
        }
    };
    async post(req, res) {
        try {
            const temp1 = await this.knex("productcategory")
            .where({name: req.body.category});
            let category = null;
            if (temp1[0]) {
                category = temp1[0]._id;
            } else {
                await this.knex.raw('SELECT setval(\'"productcategory__id_seq"\', (SELECT MAX(_id) from "productcategory"));');
                let result1 = await this.knex('productcategory').insert({name: req.body.category}).returning('_id');
                category = result1[0];
            };
            const temp2 = await this.knex("productbrand")
            .where({name: req.body.brand});
            let brand = null;
            if (temp2[0]) {
                brand = temp2[0]._id;
            } else {
                await this.knex.raw('SELECT setval(\'"productbrand__id_seq"\', (SELECT MAX(_id) from "productbrand"));');
                let result2 = await this.knex('productbrand').insert({name: req.body.brand}).returning('_id');
                brand = result2[0];
            };
            const newProduct = {
                name: req.body.name,
                price: req.body.price,
                image: req.body.image,
                brand: brand,
                category: category,
                countInStock: req.body.countInStock,
                description: req.body.description || req.body.name,
                rating: req.body.rating || 0,
                numReviews: req.body.numReviews || 0,
            };
            await this.knex.raw('SELECT setval(\'"product__id_seq"\', (SELECT MAX(_id) from "product"));');
            let result = await this.knex('product').insert(newProduct).returning('_id');
            if (result[0]) {
                res.status(201).send({
                    message: "New Product Created",
                    data: {...newProduct,
                    _id: result[0],
                    brand: req.body.brand,
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
        }
    };
};

module.exports = ProductRouter;