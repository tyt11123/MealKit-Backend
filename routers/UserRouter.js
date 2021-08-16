const express = require("express");
const { getToken, getResetToken, isAuth, isReset, isAdmin, isCourier } = require('../util');
const axios = require('axios');
const bcrypt = require('../bcrypt');

class UserRouter {
    constructor(knex, transporter) {
        this.knex = knex;
        this.transporter = transporter;
    };
    router() {
        let router = express.Router();
    
        router.put("/reset", isAuth, isReset, this.put_reset.bind(this));
        router.put("/:id", isAuth, this.put.bind(this));
        router.post("/signin", this.post_signin.bind(this));
        router.post("/register", this.post_register.bind(this));
        router.get('/createadmin', this.createAdmin.bind(this));
        router.get('/createcourier', this.createCourier.bind(this));
        router.post("/facebook", this.post_facebook.bind(this));
        router.post("/forgot", this.post_forgot.bind(this));
        router.get("/validate", isAuth, isReset, this.get_validate.bind(this));
        router.get('/fulllist', isAuth, isAdmin, this.fulllist.bind(this));
        router.get('/favourite', isAuth, this.get_favourite.bind(this));
        router.post("/favourite", isAuth, this.post_favourite.bind(this));
        router.delete("/favourite/:id", isAuth, this.delete_favourite.bind(this));
        console.log("In the router");
    
        return router;
    };
    async put_reset(req, res) {
        try {
            const userId = req.body.userId;
            const resultUser = await this.knex("user")
            .where({_id:userId})
            .select("_id","name","email","password","phone","isAdmin","isCourier","preference", "allergies");
            if (resultUser[0]) {
                let user = resultUser[0];
                user.password = await bcrypt.hashPassword(req.body.password);
                await this.knex("user").where({_id:userId}).update(user);
                res.send({ message: 'Reset Complete'});
            } else {
                res.status(404).send({ message: 'User Not Found' });
            }
        }
        catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async put(req, res) {
        try {
            const userId = req.params.id;
            console.log(userId);
            if (userId < 10000000000) {     //local user
                const resultUser = await this.knex("user")
                .where({_id:userId})
                .select("_id","name","email","password","phone","isAdmin","isCourier","preference", "allergies");
                if (resultUser[0]) {
                    let hash = null;
                    if (req.body.password) { hash = await bcrypt.hashPassword(req.body.password); }
                    let user = resultUser[0];
                    user.name = req.body.name || user.name;
                    user.email = req.body.email || user.email;
                    user.password = hash || user.password;
                    // user.preference = req.body.preference || user.preference;
                    let query1 = await this.knex('user_productcategory').where('user_id',userId);
                    let flag1 = [];
                    for (let i = 0; i < query1.length; i++) {flag1.push(false);};
                    let preference = query1.map(x=>x.productcategory_id);
                    let flag2 = [];
                    if (req.body.preference) {
                        for (let i = 0; i < req.body.preference.length; i++) {
                            flag2.push(false);
                            let query2 = await this.knex('productcategory').where('name',req.body.preference[i]);
                            for (let j = 0; j < query1.length; j++) {
                                if (query2[0]._id === preference[j]) {flag2[i] = true; flag1[j] = true;};
                            };
                        };
                    };
                    for (let i = 0; i < query1.length; i++) {
                        if (flag1[i] === false) {
                            await this.knex('user_productcategory').where('_id',query1[i]._id).del();
                        };
                    };
                    if (req.body.preference) {
                        for (let i = 0; i < req.body.preference.length; i++) {
                            if (flag2[i] === false) {
                                let query3 = await this.knex('productcategory').where('name',req.body.preference[i]); 
                                await this.knex.raw('SELECT setval(\'"user_productcategory__id_seq"\', (SELECT MAX(_id) from "user_productcategory"));');
                                await this.knex('user_productcategory').insert({user_id: userId, productcategory_id: query3[0]._id}); 
                            };
                        };
                    };
                    // user.allergies = req.body.allergies || user.allergies;
                    let query4 = await this.knex('user_allergy').where('user_id',userId);
                    let flag3 = [];
                    for (let i = 0; i < query4.length; i++) {flag3.push(false);};
                    let allergy = query4.map(x=>x.allergy_id);
                    let flag4 = [];
                    if (req.body.allergies) {
                        for (let i = 0; i < req.body.allergies.length; i++) {
                            flag4.push(false);
                            let query5 = await this.knex('allergy').where("name","ilike",req.body.allergies[i]);
                            if (query5[0]) {
                                for (let j = 0; j < query4.length; j++) {
                                    if (query5[0]._id === allergy[j]) {flag4[i] = true; flag3[j] = true;};
                                };
                            };
                        };
                    };
                    for (let i = 0; i < query4.length; i++) {
                        if (flag3[i] === false) {
                            await this.knex('user_allergy').where('_id',query4[i]._id).del();
                        };
                    };
                    if (req.body.allergies) {
                        for (let i = 0; i < req.body.allergies.length; i++) {
                            if (flag4[i] === false) {
                                let query6 = await this.knex('allergy').where('name','ilike',req.body.allergies[i]); 
                                if (query6[0]) {
                                    let allergy = query6[0]._id;
                                    await this.knex.raw('SELECT setval(\'"user_allergy__id_seq"\', (SELECT MAX(_id) from "user_allergy"));');
                                    await this.knex('user_allergy')
                                    .insert({user_id:userId,allergy_id:allergy});
                                } else {
                                    await this.knex.raw('SELECT setval(\'"allergy__id_seq"\', (SELECT MAX(_id) from "allergy"));');
                                    let query7 = await this.knex('allergy').insert({name: req.body.allergies[i]}).returning('_id');
                                    await this.knex.raw('SELECT setval(\'"user_allergy__id_seq"\', (SELECT MAX(_id) from "user_allergy"));');
                                    await this.knex('user_allergy')
                                    .insert({user_id:userId,allergy_id:query7[0]});
                                };
                            };
                        };
                    };

                    await this.knex("user").where({_id:userId}).update(user);
                    res.send({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        isAdmin: user.isAdmin,
                        isCourier: user.isCourier,
                        phone: user.phone,
                        preference: req.body.preference || user.preference,
                        allergies: req.body.allergies,
                        token: getToken(user),
                    });
                } else {
                    res.status(404).send({ message: 'User Not Found' });
                }
            } else {
                const resultUser = await this.knex("facebook_user")
                .where({_id:userId})
                .select("_id","name","email","phone","isAdmin","isCourier");
                if (resultUser[0]) {
                    let user = resultUser[0];
                    // user.preference = req.body.preference || user.preference;
                    let query1 = await this.knex('user_productcategory').where('facebook_user_id',userId);
                    let flag1 = [];
                    for (let i = 0; i < query1.length; i++) {flag1.push(false);};
                    let preference = query1.map(x=>x.productcategory_id);
                    let flag2 = [];
                    if (req.body.preference) {
                        for (let i = 0; i < req.body.preference.length; i++) {
                            flag2.push(false);
                            let query2 = await this.knex('productcategory').where('name',req.body.preference[i]);
                            for (let j = 0; j < query1.length; j++) {
                                if (query2[0]._id === preference[j]) {flag2[i] = true; flag1[j] = true;};
                            };
                        };
                    };
                    for (let i = 0; i < query1.length; i++) {
                        if (flag1[i] === false) {
                            await this.knex('user_productcategory').where('_id',query1[i]._id).del();
                        };
                    };
                    if (req.body.preference) {
                        for (let i = 0; i < req.body.preference.length; i++) {
                            if (flag2[i] === false) {
                                let query3 = await this.knex('productcategory').where('name',req.body.preference[i]); 
                                await this.knex.raw('SELECT setval(\'"user_productcategory__id_seq"\', (SELECT MAX(_id) from "user_productcategory"));');
                                await this.knex('user_productcategory').insert({facebook_user_id: userId, productcategory_id: query3[0]._id}); 
                            };
                        };
                    } else {
                        let query3 = await this.knex('productcategory'); 
                        for (let i = 0; i < query3.length; i++) {
                            await this.knex.raw('SELECT setval(\'"user_productcategory__id_seq"\', (SELECT MAX(_id) from "user_productcategory"));');
                            await this.knex('user_productcategory').insert({facebook_user_id: userId, productcategory_id: query3[i]._id}); 
                        };
                        user.preference = query3.map(x=>x.name);
                    };
                    // user.allergies = req.body.allergies || user.allergies;
                    let query4 = await this.knex('user_allergy').where('facebook_user_id',userId);
                    let flag3 = [];
                    for (let i = 0; i < query4.length; i++) {flag3.push(false);};
                    let allergy = query4.map(x=>x.allergy_id);
                    let flag4 = [];
                    if (req.body.allergies) {
                        for (let i = 0; i < req.body.allergies.length; i++) {
                            flag4.push(false);
                            let query5 = await this.knex('allergy').where("name","ilike",req.body.allergies[i]);
                            if (query5[0]) {
                                for (let j = 0; j < query4.length; j++) {
                                    if (query5[0]._id === allergy[j]) {flag4[i] = true; flag3[j] = true;};
                                };
                            };
                        };
                    };
                    for (let i = 0; i < query4.length; i++) {
                        if (flag3[i] === false) {
                            await this.knex('user_allergy').where('_id',query4[i]._id).del();
                        };
                    };
                    if (req.body.allergies) {
                        for (let i = 0; i < req.body.allergies.length; i++) {
                            if (flag4[i] === false) {
                                let query6 = await this.knex('allergy').where('name','ilike',req.body.allergies[i]); 
                                if (query6[0]) {
                                    let allergy = query6[0]._id;
                                    await this.knex.raw('SELECT setval(\'"user_allergy__id_seq"\', (SELECT MAX(_id) from "user_allergy"));');
                                    await this.knex('user_allergy')
                                    .insert({facebook_user_id:userId,allergy_id:allergy});
                                } else {
                                    await this.knex.raw('SELECT setval(\'"allergy__id_seq"\', (SELECT MAX(_id) from "allergy"));');
                                    let query7 = await this.knex('allergy').insert({name: req.body.allergies[i]}).returning('_id');
                                    await this.knex.raw('SELECT setval(\'"user_allergy__id_seq"\', (SELECT MAX(_id) from "user_allergy"));');
                                    await this.knex('user_allergy')
                                    .insert({facebook_user_id:userId,allergy_id:query7[0]});
                                };
                            };
                        };
                    };
                    res.send({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        isAdmin: user.isAdmin,
                        isCourier: user.isCourier,
                        phone: user.phone,
                        preference: req.body.preference || user.preference,
                        allergies: req.body.allergies,
                        token: getToken(user),
                    });
                } else {
                    res.status(404).send({ message: 'User Not Found' });
                } 
            }
        }
        catch (error) {
            console.log(error);
            res.status(401).send({ message: error.message });
        }
    };
    async post_signin(req, res) {
        try {
            const resultUser = await this.knex("user")
                                    .where({email: req.body.email,})
                .select("_id", "name", "email", "password", "phone", "isAdmin", "isCourier");
            if (resultUser[0]) {
                let result = await bcrypt.checkPassword(req.body.password, resultUser[0].password);
                if (result) {
                    let signinUser = resultUser[0];
                    const resultCategory = await this.knex("user_productcategory")
                    .join('productcategory','productcategory._id','=','user_productcategory.productcategory_id')
                    .where({user_id:signinUser._id});
                    let preference = resultCategory.map(x=>x.name);
                    const resultAllergy = await this.knex("user_allergy")
                    .join('allergy','allergy._id','=','user_allergy.allergy_id')
                    .where({user_id:signinUser._id});
                    let allergies = resultAllergy.map(x=>x.name);
                    res.send({
                        _id: signinUser._id,
                        name: signinUser.name,
                        email: signinUser.email,
                        phone: signinUser.phone,
                        isAdmin: signinUser.isAdmin,
                        isCourier: signinUser.isCourier,
                        token: getToken(signinUser),
                        preference: preference,
                        allergies: allergies,
                    });
                } else {
                    res.status(401).send({ message: 'Invalid Email or Password.' });
                };
            } else {
                res.status(401).send({ message: 'Invalid Email or Password.' });
            };
        } catch {
            res.status(401).send({ message: 'Invalid Email or Password.' });
        }
    };
    async post_facebook(req, res) {
        try {
        if (req.body.access_token) {
            var accessToken = req.body.access_token;
            
            let data = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
            if (!data.data.error){
                    var payload = {
                        _id: data.data.id,
                        name: data.data.name,
                        email: data.data.email,
                        phone: null,
                        isAdmin: false,
                        isCourier: false,
                    };
                    // this code obviously should change to inserting your information into a database. 
                    const resultUser = await this.knex("facebook_user")
                                    .where({_id: data.data.id})
                                    .select("_id","name","email","phone","isAdmin","isCourier");
                    if (resultUser[0]) {
                        const resultCategory = await this.knex("user_productcategory")
                        .join('productcategory','productcategory._id','=','user_productcategory.productcategory_id')
                        .where({facebook_user_id:data.data.id});
                        let preference = resultCategory.map(x=>x.name);
                        const resultAllergy = await this.knex("user_allergy")
                        .join('allergy','allergy._id','=','user_allergy.allergy_id')
                        .where({facebook_user_id:data.data.id});
                        let allergies = resultAllergy.map(x=>x.name);
                        res.send({
                            ...resultUser[0],
                            facebook_id: data.data.id,
                            token: getToken(resultUser[0]),
                            preference: preference,
                            allergies: allergies,
                        });
                    } else {
                        await this.knex.raw('SELECT setval(\'"facebook_user_id_seq"\', (SELECT MAX(id) from "facebook_user"));');
                        await this.knex('facebook_user').insert(payload);
                        let query1 = await this.knex('productcategory');
                        let preference = query1.map(x=>x._id);
                        let preferenceName = query1.map(x=>x.name);
                        for (let i = 0; i < preference.length; i++) {
                            await this.knex.raw('SELECT setval(\'"user_productcategory__id_seq"\', (SELECT MAX(_id) from "user_productcategory"));');
                            await this.knex('user_productcategory')
                            .insert({facebook_user_id:data.data.id,productcategory_id:preference[i]});
                        };
                        res.send({
                            ...payload,
                            facebook_id: data.data.id,
                            token: getToken(payload),
                            preference: preferenceName,
                            allergies: null,
                        });
                    };
                } else{
                    res.status(401).send({message: "Missing facebook access token"});
                }
            }
        } catch (err) {
            res.status(401).send({message: err});
        };
    };
    async post_register(req,res) {
        try {
            let hash = await bcrypt.hashPassword(req.body.password);
            const newUser = {
                name: req.body.name,
                email: req.body.email,
                password: hash,
                // preference: req.body.preference,
                allergies: req.body.allergies,
                isAdmin: false,
                isCourier: false,
            };
            await this.knex.raw('SELECT setval(\'"user__id_seq"\', (SELECT MAX(_id) from "user"));');
            let result = await this.knex('user').insert(newUser).returning('_id');
            newUser._id = result[0];
            if (newUser._id) {
                if (req.body.preference) {
                    for (let i = 0; i < req.body.preference.length; i++) {
                        let query1 = await this.knex('productcategory').where({name:req.body.preference[i]});
                        let preference = query1[0]._id;
                        await this.knex.raw('SELECT setval(\'"user_productcategory__id_seq"\', (SELECT MAX(_id) from "user_productcategory"));');
                        await this.knex('user_productcategory')
                        .insert({user_id:newUser._id,productcategory_id:preference});
                    };
                };
                if (req.body.allergies) {
                    for (let i = 0; i < req.body.allergies.length; i++) {
                        let query1 = await this.knex('allergy').where("name","ilike",req.body.allergies[i]);
                        if (query1[0]) {
                            let allergy = query1[0]._id;
                            await this.knex.raw('SELECT setval(\'"user_allergy__id_seq"\', (SELECT MAX(_id) from "user_allergy"));');
                            await this.knex('user_allergy')
                            .insert({user_id:newUser._id,allergy_id:allergy});
                        } else {
                            await this.knex.raw('SELECT setval(\'"allergy__id_seq"\', (SELECT MAX(_id) from "allergy"));');
                            let query2 = await this.knex('allergy').insert({name: req.body.allergies[i]}).returning('_id');
                            await this.knex.raw('SELECT setval(\'"user_allergy__id_seq"\', (SELECT MAX(_id) from "user_allergy"));');
                            await this.knex('user_allergy')
                            .insert({user_id:newUser._id,allergy_id:query2[0]});
                        };
                    };
                };
                res.send({
                _id: result[0],
                name: newUser.name,
                email: newUser.email,
                isAdmin: newUser.isAdmin,
                isCourier: newUser.isCourier,
                token: getToken(newUser),
                preference: req.body.preference,
                allergies: newUser.allergies,
                });
            }
        }
        catch (error) {
            console.log(error);
            res.status(401).send({ message: error.message });
        }
    };
    async createAdmin(req,res) {
        try {
            let hash = await bcrypt.hashPassword('1234');
            const newUser = {
              name: 'MealKit',
              email: 'meal.kit@gmail.com',
              password: hash,
              isAdmin: true,
              isCourier: false,
            };
            await this.knex.raw('SELECT setval(\'"user__id_seq"\', (SELECT MAX(_id) from "user"));');
            let result = await this.knex('user').insert(newUser).returning('_id');
            if (result[0]) {
                newUser._id = result[0];
                res.send({
                _id: result[0],
                name: newUser.name,
                email: newUser.email,
                isAdmin: newUser.isAdmin,
                isCourier: newUser.isCourier,
                token: getToken(newUser),
                });
            }
        } catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async createCourier(req,res) {
        try {
            let hash = await bcrypt.hashPassword('courier@a');
            const newUser = {
              name: 'Staff',
              email: 'courier@a',
              password: hash,
              isAdmin: false,
              isCourier: true,
            };
            await this.knex.raw('SELECT setval(\'"user__id_seq"\', (SELECT MAX(_id) from "user"));');
            let result = await this.knex('user').insert(newUser).returning('_id');
            if (result[0]) {
                newUser._id = result[0];
                res.send({
                _id: result[0],
                name: newUser.name,
                email: newUser.email,
                isAdmin: newUser.isAdmin,
                isCourier: newUser.isCourier,
                token: getToken(newUser),
                });
            }
        } catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async fulllist(req,res) {
        try {
            const resultUser = await this.knex("user")
            .select("_id", "name", "email", "phone", "isAdmin", "isCourier");
            const resultUser2 = await this.knex("facebook_user")
            .select("_id", "name", "email", "phone", "isAdmin", "isCourier");
            res.send([...resultUser, ...resultUser2]);
        } catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async post_forgot(req, res) {
        try {
            const resultUser = await this.knex("user")
                                    .where({email: req.body.email,})
                .select("_id", "name", "email", "phone", "isAdmin", "isCourier");
            if (resultUser[0]) {
                let signinUser = resultUser[0];
                let token = getResetToken(signinUser);
                let mailOptions = {
                    from: "no.reply_meal.kit@gmail.com",
                    to: req.body.email,
                    subject: `Reset Password for MealKit Account`,
                    html: `<h4>Please reset your password by accessing the link below</h4>
                    <h4>The link would be valid for 1 hour, starting from the time we received your request.</h4>
                    <a href='${process.env.REACT_FRONTEND}/reset/${token}'>${process.env.REACT_FRONTEND}/reset/${token}</a>
                    `,
                };
                this.transporter.sendMail(mailOptions, (error, response) => {
                    if (error) {
                      res.send(error);
                    } else {
                      res.send(mailOptions);
                    }
                    this.transporter.close();
                  });
                res.send({ message: 'Email Sent.' });
            } else {
                res.status(202).send({ message: 'Invalid Email.' });
            };
        } catch {
            res.status(401).send({ message: 'Invalid Email or Password.' });
        }
    };
    async get_validate(req, res) {
        try {
            res.send({
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                isAdmin: req.user.isAdmin,
                isCourier: req.user.isCourier,
                isReset: req.user.isReset,
                });
        } catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async get_favourite(req, res) {
        try {
            const result1 = (Number(req.user._id) > 100000000)? 
            await this.knex("user_product").where({facebook_user_id: req.user._id}):
            await this.knex("user_product").where({user_id: req.user._id});
            const product_id = result1.map(x=>x.product_id);
            let ans = [];
            for (let i = 0; i < product_id.length; i++) {
                let product = await this.knex("product")
                .where({_id: product_id[i]});
                const reviews = await this.knex("review")
                .where({product_id: product_id[i]})
                .column("_id","name","rating","comment","createdAt","updatedAt");
                if (product[0]) {
                    product[0].image = JSON.parse(product[0].image);
                    let query1 = await this.knex('product_category').where({product_id:product_id[i]});
                    let categoryIDs = query1.map(x=>x.productcategory_id);
                    const categories = await this.knex("productcategory").whereIn("_id",categoryIDs);
                    const types = await this.knex("producttype").where({_id:product[0].type});
                    const payload = {...product[0], reviews: reviews, category: categories.map(x=>x.name), type: types[0].name};
                    ans.push(payload);
                }
            };
            res.send(ans);
        } catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
    async post_favourite(req,res) {
        try {
            const { product_id } = req.body;
            const result1 = (Number(req.user._id) > 100000000)?  
            await this.knex("user_product").where({facebook_user_id: req.user._id, product_id}):
            await this.knex("user_product").where({user_id: req.user._id, product_id});
            if (result1[0]) {
                res.send({ message: 'Already Exist' });
            } else {
                await this.knex.raw('SELECT setval(\'"user_product__id_seq"\', (SELECT MAX(_id) from "user_product"));');
                (Number(req.user._id) > 100000000)? 
                await this.knex('user_product').insert({facebook_user_id: req.user._id, product_id}):
                await this.knex('user_product').insert({user_id: req.user._id, product_id});
                res.send({ message: 'Done' });
            };
        }
        catch (error) {
            res.status(401).send({ message: error.message });
        };
    };
    async delete_favourite(req, res) {
        try {
            const product_id = req.params.id;
            const deletedFavourite = (Number(req.user._id) > 100000000)? 
            await this.knex("user_product").where({facebook_user_id: req.user._id, product_id}).del():
            await this.knex("user_product").where({user_id: req.user._id, product_id}).del();
            if (deletedFavourite) {
                res.send({ message: 'Favourite Deleted' });
            } else {
                res.status(404).send({ message: 'Favourite Already Removed' });
            }
        } catch (err) {
            res.status(401).send('Error in Deletion.');
        }
    };
};

module.exports = UserRouter;