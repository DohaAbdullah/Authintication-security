```js 

//jshint esversion:6
require("dotenv").config();
const mongoose = require("mongoose");
const ejs = require("ejs");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

// const encrypt = require("mongoose-encryption");
// const bcrypt = require("bcrypt");

// const salt = 10;
// const myPlaintextPassword = "s0//P4$$w0rD";
// const someOtherPlaintextPassword = "not_bacon";


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "Our Little Secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
// mongoose.set("useCreateIndex" , true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User = new mongoose.model("users", userSchema);

passport.use(User.createStrategy());

// mongoose-local-serializeUser
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOne({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated) {
    res.render("secrets");
  } else {
    res.redirect("/");
  }
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        res.send(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

// app.post("/register", (req, res) => {
//   bcrypt.hash(myPlaintextPassword, salt, function (err, hash) {
//     const newUser = new User({
//       email: req.body.username,
//       password: hash,
//     });

//     newUser.save(function (err) {
//       if (!err) {
//         res.render("secrets");
//       } else {
//         console.log(err);
//       }
//     });
//   });
// });

// app.post("/login", (req, res) => {
//   const username = req.body.username;
//   const password = req.body.password;

//   User.findOne({ email: username }, function (err, founduser) {
//     if (err) {
//       console.log(err);
//     } else {
//       if (founduser) {
//         bcrypt.compare(password, founduser.password, function (err, result) {
//             res.render("secrets");
//         });
//       } else {
//         res.send(err);
//       }
//     }
//   });
// });

app.listen("3000", function (req, res) {
  console.log("server is up !");
});```