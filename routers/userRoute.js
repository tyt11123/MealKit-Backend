const express = require("express");
const knexfile = require("../knexfile");

const knex = require('knex');
const router = express.Router();

router.post('./signin', async (req, res)=>{
    const signinUser = await user.findOne({
        email: req.body.email,
        password:req.body.password
    })
    if (signinUser) {
        res.send({
            _id: signinUser.id,
            name: signinUser.name,
            email: signinUser.email,
            isAdmin: signinUser.isAdmin,
            token: getToken(signinUser)
        })
    } else {
        res.status(401).send({ msg: 'Invalid Email' });
    }

})

router.post('./register', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    });
    const newUser = await user.save();
    if (newUser) {
        res.send({
            _id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            isAdmin: newUser.isAdmin,
            preference: newUser.preference,
            allergies: newUser.allergies,
            token: getToken(newUser)
        })
    } else {
        res.status(401).send({ msg: 'Invalid Data' });
    }
    }
)

router.get("/createadmin", async (req, res) => {
   
    knex("userTable").insert({
    name: 'Ben',
    email: 'ben@123.com',
    password: '123',
        isAdmin: true
    })
        .then(() => {
        res.send(newUser);
    })
    // try {
    //     const user = new user({
    //         name: 'Ben',
    //         email: 'ben@123.com',
    //         password: '123',
    //         isAdmin: true
    //     });
    //     const newUser = await user.save();
    //     res.send(newUser);
    // } catch (error) {
    //     res.send({
    // msg:error.message})
    // }
})
export default router;