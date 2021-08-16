const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const products = require("./data");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();
const jwt = require("jwt-simple");
const axios = require("axios");
const authClass = require("./authentications/auth");
const fs = require("fs");

const router = require("./routers/SocketRouter");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const knexConfig = require("./knexfile").development;
const knex = require("knex")(knexConfig);

const app = express();
const auth = authClass();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("combined"));

app.use(cookieParser());
const options = {
  cert: fs.readFileSync("./localhost.crt"),
  key: fs.readFileSync("./localhost.key"),
};

const LinkService = require("./services/LinkService");
const LinkRouter = require("./routers/LinkRouter");

app.get("/", (req, res) => {
  res.send("Hello world");
});

// app.use("/api/users", userRoute);

// app.get("/api/products/:id", (req, res) => {
//     const productId = req.params.id
//     const product = products.find(x => x._id === productId);
//     if (product)
//         res.send(product);
//     else
//         res.status(404).send({msg:"Product Not Found"})

// });

// app.get("/api/products", (req, res) => {
//     res.send(products);

///*end delete///
// });

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "linnie50@ethereal.email",
    pass: "2bQUGrWdCtWEEhxArb",
  },
});
//https://ethereal.email/messages/

const UserRouter = require("./routers/UserRouter");
app.use("/api/users/", new UserRouter(knex, transporter).router());

const ProductRouter = require("./routers/ProductRouter");
app.use("/api/products/", new ProductRouter(knex).router());

const OrderRouter = require("./routers/OrderRouter");
app.use("/api/orders/", new OrderRouter(knex, transporter).router());

const PhoneRouter = require("./routers/PhoneRouter");
app.use("/api/phones/", new PhoneRouter(knex).router());

const ShippingRouter = require("./routers/ShippingRouter");
app.use("/api/shippings/", new ShippingRouter(knex).router());

const StripeRouter = require("./routers/StripeRouter");
app.use("/api/stripe/", new StripeRouter().router());

const TagRouter = require("./routers/TagRouter");
app.use("/api/tags/", new TagRouter(knex).router());

const BundleRouter = require("./routers/BundleRouter");
app.use("/api/bundle/", new BundleRouter(knex).router());

const DayOffRouter = require("./routers/DayOffRouter");
app.use("/api/dayoff/", new DayOffRouter(knex).router());

const VoucherRouter = require("./routers/VoucherRouter");
app.use("/api/vouchers/", new VoucherRouter(knex, transporter).router());

const RedeemRouter = require("./routers/RedeemRouter");
app.use("/api/redeem/", new RedeemRouter(knex).router());

const DashboardRouter = require("./routers/DashboardRouter");
app.use("/api/dashboard/", new DashboardRouter(knex).router());

const ShipmentRouter = require("./routers/ShipmentRouter");
app.use("/api/shipments/", new ShipmentRouter(knex).router());

const DeliveryRouter = require("./routers/DeliveryRouter");
app.use("/api/deliveries/", new DeliveryRouter(knex).router());

const uploadRoute = require('./routers/uploadRoute');
app.use('/api/uploads/', uploadRoute);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

//chatroom start
const https = require("https").createServer(options, app);
const io = require("socket.io")(https);

io.on("connect", (socket) => {
  console.log("new connection");

  socket.on("join", ({ name, room }, callback) => {
    console.log(name, room);
    const { user } = addUser({ id: socket.id, name, room });

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name}has left.`,
      });
    }
  });
});

app.use(router);
//chat room end

//email start
app.post("/api/forma", (req, res) => {
  let data = req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "linnie50@ethereal.email",
      pass: "2bQUGrWdCtWEEhxArb",
    },
  });
  //https://ethereal.email/messages/

  let mailOptions = {
    from: "no.reply_meal.kit@gmail.com",
    to: data.email,
    subject: `Payment Receipt from MealKit - Order# ${data._id}`,
    html: `
    <div style="margin:.5rem;text-align: center;">
    <div style="display: inline-block;">

        <a target="_blank" href="${process.env.REACT_FRONTEND}"
            style="display:inline-flex;text-decoration: none;font-size: 1.1rem;color: black;">
            <img src="${process.env.REACT_FRONTEND}/static/media/logoMealkit.d54da333.svg"
                style="width:5rem;font-size:1.5rem;">
            <h1>MEALKIT</h1></img>
        </a>
        <br>
        <h3>Thank you for your purchase!</h3>
        <br>
        <p style="color:#777;font-size: 1.1rem;margin-left: 25%;
        margin-right: 25%;">Hi ${data.name}, we will ship your order according
            to stock availablity.
            An email with tracking number will be sent to you once your order is shipped. Thank you.</p>

        <div
            style="justify-content: space-around; display: inline-flex;border-bottom: 2px solid rgba(4,17,25,0.27);">
            <a target="_blank" style="text-decoration: none;
                   font-size: 1.1rem;"
                href="${process.env.REACT_FRONTEND}/signin?redirect=/order/${data._id}">
                <p style="background-color: #f36127;
            width: 9rem;
            border-radius: .5rem;
            padding: 1rem;
            color: white;">View your order</p>
            </a>

            <h4 style="padding: 1rem;">Or</h4>
            <a target="_blank" style="text-decoration: none;
                   font-size: 1.1rem;"
                href="${process.env.REACT_FRONTEND}/signin?redirect=/order/${data._id}">
                <p style="background-color: #113067;
            width: 9rem;
            border-radius: .5rem;
            padding: 1rem;
            color: white;">Visit our site</p>
            </a>
        </div>
        <div style="display:flex;flex-direction: column;border-bottom: 1px solid rgba(4,17,25,0.27);">
            <div style="border-bottom: 2px solid rgba(4,17,25,0.27);margin: 1rem;padding-bottom: .8rem;">
                <h3>Order Summary</h3>
                ${data.orderItems.map(x=>`
                <div style="display: inline-flex;
                border: 1px solid lightblue;
                
                border-radius: .5rem;align-items: center;
                margin: 1.5rem;">

                    <img src="${process.env.REACT_FRONTEND}/static/media/logoMealkit.d54da333.svg"
                        style="width:4rem;margin-left: .5rem;"></img>
                    <p style="margin: .5rem ;">
                        ${x.name}<br>
                        Quantity:&nbsp;${x.qty}
                    </p>
                    <p style="margin-left: 5rem;margin-right: 2rem;">
                        $ ${x.price}
                    </p>
                </div>
                `)}
            </div>
            <div style="justify-content: flex-end;flex-direction:column; margin: .5rem;">
                <div style="margin-bottom: 1.3rem; border-bottom: 1px solid rgba(4,17,25,0.27);">
                    <div
                        style="display: inline-flex;justify-content: space-between;align-items: center; width: 40rem;">


                        <p style="margin: .5rem ;">
                            Subtotal:

                        </p>
                        <p style="margin-left: 5rem;margin-right: 2rem;">
                            $ ${data.itemsPrice}
                        </p>
                    </div>
                    <div
                        style="display: inline-flex;justify-content:space-between;align-items: center;width: 40rem;">
                        <p style="margin: .5rem ;">
                            Shipping:

                        </p>
                        <p style="margin-left: 5rem;margin-right: 2rem;">
                            $ ${data.shippingPrice}
                        </p>
                    </div>
                </div>
                <div style="display: inline-flex;justify-content:space-between;align-items: center;width: 40rem;font-weight: bolder;font-size: 1.5rem;background-color: #f36127;
                border-radius: 0.5rem;
                color: white;">
                    <p style="margin: .5rem ;">
                        Total:

                    </p>
                    <p style="margin-left: 5rem;margin-right: 2rem;">
                        $ ${data.totalPrice}
                    </p>
                </div>
            </div>
        </div>

        <div style="display: flex; flex-direction: column;">
            <h4>Customer Information</h4>
            <div style="display: flex; flex-direction: row; justify-content: space-around;">
                <div style="display: inline-block; text-align: left;">
                    <h6 style="display: block;">
                        Shipping address<h6>
                            <p style="display: block;font-size: 1rem;">
                                ${data.name}<br>
                                ${data.shipping.address},&nbsp;${data.shipping.area},&nbsp;
                                ${data.shipping.city},&nbsp;${data.shipping.country},&nbsp;
                            </p>
                </div>
                <div style="display: inline-block; text-align: left;">
                    <h6 style="display: block;">
                        Billing address<h6>
                            <p style="display: block;font-size: 1rem;">
                                ${data.name}<br>
                                ${data.shipping.address},&nbsp;${data.shipping.area},&nbsp;
                                ${data.shipping.city},&nbsp;${data.shipping.country},&nbsp;
                            </p>
                </div>
            </div>
        </div>
        <div style="display: inline-flex;
                border: 1px solid #113067;
                
                border-radius: .5rem;align-items: center;
                margin: 1.5rem;">
            <h6 style="margin: .5rem ;">
                Shipping status<br>
                <span style="color:#777">${data.isDelivered ? 'Delivered' : 'Pending'}</span>
            </h6>

            <h6 style="margin: .5rem ;">
                Payment status<br>
                <span style="color:#777">${data.successPay ? 'Paid' : 'Pending'}</span> 
            </h6>
            
        </div>
        <hr>
        <p>This email is auto-generated. Please do not reply to this email. You can contact us at
        <a target="_blank" href="${process.env.REACT_FRONTEND}">
        ${process.env.REACT_FRONTEND}
        </a>
        </p>
    </div>

        `,
  };

  transporter.sendMail(mailOptions, (error, response) => {
    if (error) {
      res.status(401).send(error);
    } else {
      res.send(mailOptions);
    }

    transporter.close();
  });
});
//EMAIL END

//port
const port = process.env.PORT || 5000;
// app.listen(port, () => { console.log("server started at ", { port }) })
//for chat room
https.listen(port, () => {
  console.log("server started at ", { port });
});
