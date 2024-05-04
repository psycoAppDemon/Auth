const express = require("express");
const app = express();
const { DBConnection } = require("./database/db");
const User = require("./model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
dotenv.config();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//middleware for cookie
app.use(cookieParser());

DBConnection();

// get request from frontend
app.get("/", (req, res) => {
  res.send("Hello Everyone Hogwarts!");
});

//post request from frontend

app.post("/register", async (req, res) => {
  try {
    // get all the data from frontend
    // const firstname = req.body.firstname;
    // const lastname = req.body.lastname;
    // const email = req.body.email;
    // const password = req.body.password;
    const { firstname, lastname, email, password } = req.body;

    // check whether none of the data was null
    if (!(firstname, lastname, email, password)) {
      return res.status(404).send("Please enter all the required info");
    }

    //check if the user already exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exist");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    res.status(200).json({
      message: "User Registered Successfully!",
      user,
    });
  } catch (error) {
    console.error(error.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      return res.status(404).send("Please enter all the required info");
    }

    const registeredUser = await User.findOne({ email });
    if (!registeredUser) {
      return res.status(404).send("User not found!");
    }

    const enteredPassword = bcrypt.compareSync(
      password,
      registeredUser.password
    );
    if (!enteredPassword) {
      return res.status(404).send("Wrong Password!");
    }

    // token: 1. same user or not
    // 2. individual permissions -- e.g. manager screen, user screen, ceo screen;
    const token = jwt.sign(
      {
        id: registeredUser._id,
        email: email,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    console.log(registeredUser);
    registeredUser.password = undefined;

    // //store cookie
    const option = {
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      httponly: true, //so that cookie can be manipulated by backend only
    };

    res.status(200).cookie("token", token, option).json({
      message: "User logged in successfully!",
      token,
    });
  } catch (error) {
    console.error(error.message);
  }
});

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
