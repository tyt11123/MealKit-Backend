const express = require("express");
const { getToken, isAuth } = require('../util');
require('dotenv').config();
const client = require("twilio")(
    process.env.ACCOUNT_SID,
    process.env.AUTH_TOKEN
  );

class PhoneRouter {
    constructor(knex) {
        this.knex = knex;
    };
    router() {
        let router = express.Router();
        router.post("/request", isAuth, this.post_request.bind(this));
        router.post("/check", isAuth, this.post_check.bind(this));
        return router;
    };
    async post_request(req, res) {
        try {
        const { phone } = req.body;
      
        // Start Twilio verify
        const verification = await client.verify
          .services(process.env.VERIFY_SERVICE_SID)
          .verifications.create({ to: phone, channel: "sms" });
      
        // Send the PaymentIntent client_secret to the client.
        const status = verification.status;
        res.send({ status });
      } catch (error) {
        res.status(401).send(error);
      }
    };
    async post_check(req, res) {
        const { phone, smscode, } = req.body;

        try {
      
          // Check Twilio verify code
          const verificationCheck = await client.verify
            .services(process.env.VERIFY_SERVICE_SID)
            .verificationChecks.create({ to: phone, code: smscode });
      
          // If successful, write the phone to the user table
          if (verificationCheck.status === "approved") {
            let temp1 = await this.knex("user").where({phone:phone.substring(4)});
            let temp2 = await this.knex("facebook_user").where({phone:phone.substring(4)});
            if (temp1[0] || temp2[0]) {
              res.status(202).send({status: "repeated"}); // inform frontend that the phone is occupied already
            } else {
              await this.knex("user").where({_id:Number(req.user._id)}).update('phone', phone.substring(4));
              await this.knex("facebook_user").where({_id:Number(req.user._id)}).update('phone', phone.substring(4));
        
              // Return the status
              res.send({ status: verificationCheck.status });
            }
          } else {
            res
              .status(400)
              .send({ error: { message: "Incorrect code. Please try again!" } });
          }
        } catch (error) {
          res.status(400).send({ error });
        }
    };
};

module.exports = PhoneRouter;