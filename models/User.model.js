const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },

  token: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  // resetTokenExpiration: {
  //   type: Date,
  //   default: null,
  // },
});

const UserModel = mongoose.model("user", userSchema);

module.exports = { UserModel };
