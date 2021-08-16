// import * as passport from 'passport'
// import * as passportJWT from 'passport-jwt';
// import config from './config';
// import users from './users';

const passport = require('passport');
const passportJWT = require('passport-jwt');
const config = require('./config');
const users = require('./users');

const ExtractJwt = passportJWT.ExtractJwt;

module.exports = function(){
    const strategy = new passportJWT.Strategy({
        secretOrKey: config.jwtSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },(payload,done)=>{
        // Logic here reads from a JSON, in a real application you will read from a database
        const user = users.find((user)=>{
            return user.id == payload.id
        });
        if (user) {
            let temp1 = {...user};
            delete temp1.password;
            return done(null, temp1);
        } else {
            return done(new Error("User not found"), null);
        }
    });
    passport.use(strategy);

    return {
        initialize: function() {
            return passport.initialize();
        },
        authenticate: function() {
            return passport.authenticate("jwt", config.jwtSession);
        }
    };
}