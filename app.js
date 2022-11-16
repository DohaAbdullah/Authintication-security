//jshint esversion:6
require("dotenv").config();
const mongoose = require("mongoose");
const ejs = require("ejs");
const express = require("express");
const app = express();
const encrypt = require("mongoose-encryption");
const bcrypt = require("bcrypt");

const salt = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});

const User = new mongoose.model("users", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  bcrypt.hash(myPlaintextPassword, salt, function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash,
    });

    newUser.save(function (err) {
      if (!err) {
        res.render("secrets");
      } else {
        console.log(err);
      }
    });
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username }, function (err, founduser) {
    if (err) {
      console.log(err);
    } else {
      if (founduser) {
        bcrypt.compare(password, founduser.password, function (err, result) {
            res.render("secrets");
        });
      } else {
        res.send(err);
      }
    }
  });
});

app.listen("3000", function (req, res) {
  console.log("server is up !");
});
