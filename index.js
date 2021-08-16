const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require('jwt-simple');
const axios = require ('axios');
const authClass = require('./authentications/auth');

const knexConfig = require("./knexfile").development;
const knex = require("knex")(knexConfig);

const app = express();
const auth = authClass();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("combined"));
app.use(auth.initialize());

const LinkService = require("./services/LinkService");
const LinkRouter = require("./routers/LinkRouter");

const linkService = new LinkService(knex);

app.use("/api/link/", new LinkRouter(linkService).router());

app.use("/api/users/", new UserRouter(auth, knex).router());

app.listen(8080, () => {
  console.log("Application listening to port 8080");
});
