const express = require("express");
const { UserModel } = require("../models/User.model");
const userRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

userRouter.get("/", async (req, res) => {
  let users = await UserModel.find();
  res.send(users);
});

userRouter.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const check_exist = await UserModel.find({ email });
  try {
    if (check_exist.length > 0) {
      res.status(404).send({ response: "user already registerd please login" });
    } else {
      //we required bcryt package for hasing password
      bcrypt.hash(password, 4, async function (err, hash) {
        // Store hash in your password DB.
        const userDetails = new UserModel({ name, email, password: hash });
        await userDetails.save();
        res.status(200).send({ response: "user registerd successfully" });
      });
    }
  } catch (error) {
    res.status(404).send("something went wrong please try again");
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const check_exist = await UserModel.find({ email });

  if (check_exist.length > 0) {
    try {
      //compare user password with hased password
      const hased_password = check_exist[0].password;
      bcrypt.compare(password, hased_password, function (err, result) {
        // result == true if password matched
        if (result) {
          //genrate a token using jwt package and send back to user
          var token = jwt.sign({ userID: check_exist[0]._id }, "secret", {
            expiresIn: "24h",
          });
          res.send({ msg: "Login successfully", token: token });
        } else {
          res.status(404).send({ response: "Invalid Credential" });
        }
      });
    } catch (error) {
      console.log(error.message);
      res.status(404).send("something went wrong please try after sometime");
    }
  } else {
    res.status(400).send({ response: "please signup first" });
  }
});

userRouter.get("/getProfile", async (req, res) => {
  let token = req.headers.token;
  try {
    var decoded = jwt.verify(token, "secret");
    let { userID } = decoded;
    let userDetails = await UserModel.findOne({ _id: userID });
    res.send({
      res: {
        name: userDetails.name,
        email: userDetails.email,
      },
    });
  } catch (err) {
    res.status(404).send({ res: "Something went wrong " });
    console.log(err);
  }
});

// Forgot password

const securePassword = async (password) => {
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    return hashPassword;
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const sandResetPasswordMail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: 587,
      service: process.env.SERVICE,
      auth: {
        user: process.env.userEmail,
        pass: process.env.userPass,
      },
    });

    const mailOptions = {
      from: process.env.userEmail,
      to: email,
      subject: "Reset Your Password",
      html: `<p>Click <a href="https://apple-hub-orignal.netlify.app/user/reset-password/${token}">here</a> to reset your password.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("error", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

userRouter.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await UserModel.findOne({ email: email });

    if (userData) {
      const randomString = randomstring.generate();
      const data = await UserModel.updateOne(
        { email: email },
        { $set: { token: randomString } }
      );
      sandResetPasswordMail(userData.email, randomString);
      res.send({ success: true, msg: "Please check your inbox of mail" });
    } else {
      res.send({ success: true, msg: "This email does not exit" });
    }
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
});

userRouter.post("/reset-password/:token", async (req, res) => {
  try {
    // const token = req.query.token;
    const token = req.params.token;
    const tokenData = await UserModel.findOne({ token: token });

    if (tokenData) {
      const password = req.body.password;
      const newPassword = await securePassword(password);
      const userData = await UserModel.findByIdAndUpdate(
        { _id: tokenData._id },
        { $set: { password: newPassword, token: "" } },
        { new: true }
      );
      res.send({
        success: true,
        msg: "User password has been reset",
        data: userData,
      });
    } else {
      res.send({ success: true, msg: "This link has been expired" });
    }
  } catch (error) {
    res.status(404).send({ success: false, msg: error.message });
  }
});

module.exports = { userRouter };
