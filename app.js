const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { connection } = require("./config/db");
const { userRouter } = require("./Routes/User.route");
const { mobileRouter } = require("./Routes/MobileProducts.route");
const { wishlistRouter } = require("./Routes/Wishlist.route");
const { cartRouter } = require("./Routes/Cart.route");
// const { Authentication } = require("./Middleware/middleware");
const Razorpay = require("razorpay");
const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send({ message: "Welcome..." });
});

var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

app.post("/create-order", async (req, res) => {
  var options = {
    amount: req.body.total,
    currency: "INR",
    receipt: "order_rcptid_11",
  };

  try {
    const order = await instance.orders.create(options);
    res.send(order);
  } catch (error) {
    console.log(error.message);
  }
});

app.use("/user", userRouter);
// app.use(Authentication);
app.use("/iphone", mobileRouter);
app.use("/wishlist", wishlistRouter);
app.use("/cart", cartRouter);

app.listen(PORT, async () => {
  try {
    await connection;
    console.log("db is connected successfully");
  } catch (err) {
    console.log(err);
  }
  console.log(`Server is listning on PORT ${PORT}`);
});
