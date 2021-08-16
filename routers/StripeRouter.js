const express = require("express");
const { isAdmin, isAuth } = require('../util');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class StripeRouter {
    constructor(){};
    router() {
        let router = express.Router();
        router.get("/public-key", this.get_public_key.bind(this));
        router.post("/create-payment-intent", this.post_payment_intent.bind(this));
        return router;
    };
    get_public_key(req, res) {
        res.send({ publicKey: process.env.STRIPE_PUBLISHABLE_KEY });
    };
    async post_payment_intent (req, res) {
        const body = req.body;
        // const productDetails = getProductDetails();
        const options = {
            ...body,
            amount: req.body.amount*100,
            // currency: productDetails.currency
        };
        try {
            const paymentIntent = await stripe.paymentIntents.create(options);
            res.json(paymentIntent);
        } catch (err) {
            res.json(err);
        }
    };
};

module.exports = StripeRouter;