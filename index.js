const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;

//mongodb connection

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connected to mongodb database"))
  .catch((err) => console.log(err));

// user schema
const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmPassword: String,
  image: String,
});

// Model
const userModel = mongoose.model("user", userSchema);

//api

app.get("/", (req, res) => {
  res.send("Server is running..");
});

app.post("/signup", async (req, res) => {
  const { email } = req.body;

  // Sign up
  await userModel.findOne({ email: email }).then((result) => {
    if (result) {
      res.send({ message: "Email is already registered!", alert: false });
    } else {
      const data = userModel(req.body);
      const save = data.save();
      res.send({ message: "Registration successful🤝", alert: true });
    }
  });
});

//login api
app.post("/login", async (req, res) => {
  const { email } = req.body;

  await userModel.findOne({ email: email }).then((result) => {
    if (result) {
      const dataSend = {
        _id: result._id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        image: result.image,
      };

      res.send({ message: "Login Successful!", alert: true, data: dataSend });
    } else {
      res.send({
        message: "The email is not available. Please sign up.",
        alert: false,
      });
    }
  });
});

// Product schema

const schemaProduct = mongoose.Schema({
  name: String,
  category: String,
  price: String,
  description: String,
  image: String,
});

// Product model

const productModel = mongoose.model("product", schemaProduct);

// Save product in database

app.post("/uploadProduct", async (req, res) => {
  const data = await productModel(req.body);
  await data.save();

  res.send({ message: "Upload successful!" });
});

app.get("/product", async (req, res) => {
  const data = await productModel.find({});

  res.send(JSON.stringify(data));
});

app.listen(PORT, () => console.log("Server is running at port : " + PORT));
