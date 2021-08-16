const express = require("express");
const jwt = require("jwt-simple");
const axios = require('axios');
const users = require('./users');
const config = require('./config');

class AuthRouter {
    constructor() {};
    router() {
        let router = express.Router();
        router.post("/", this.post.bind(this));
        router.post("/facebook", this.post_facebook.bind(this));
        return router;
    };
    post(req, res) {  
        console.log('Logging In')
        if (req.body.email && req.body.password) {
            var email = req.body.email;
            var password = req.body.password;
            console.log(email, password)
            var user = users.find((u)=> {
                return u.email === email && u.password === password;
            });
            if (user) {
                var payload = {
                    id: user.id
                };
                var token = jwt.encode(payload, config.jwtSecret);
                console.log('working')
                res.json({
                    token: token
                });
            } else {
                console.log('Failure')
    
                res.sendStatus(401);
            }
        } else {
            console.log('1')
    
            res.sendStatus(401);
    
        }
    };

    post_facebook(req, res) {  
        console.log('Logging In Using Facebook');
        
        if (req.body.access_token) {
            var accessToken = req.body.access_token;
            
            axios.get(`https://graph.facebook.com/me?fields=name,email&access_token=${accessToken}`)
            .then((data)=>{
                if (!data.data.error){
                    var payload = {
                        id: accessToken
                    };
                    // this code obviously should change to inserting your information into a database. 
                    users.push({
                        id: accessToken,
                        name: data.data.name,
                        email: data.data.email,
                        password: "123456"
                    })
                    var token = jwt.encode(payload, config.jwtSecret);
                    res.json({
                        token: token
                    });
                }else{
                    res.sendStatus(401);
                }
            }).catch((err)=>{
                console.log(err);
                res.sendStatus(401);
            });
        } else {
            res.sendStatus(401);
        }
    };
};

module.exports = AuthRouter;