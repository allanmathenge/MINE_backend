const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Stripe = require("stripe");

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

/* Payment gateway */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/checkout-payment", async (req, res) => {
  try {
    const params = {
      submit_type: "pay",
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_options: [{ shipping_rate: "shr_1OYbSVFkEFJH7MWThqjUJMmm" }],

      line_items: req.body.map((item) => {
        return {
          price_data: {
            currency: "KES",
            product_data: {
              name: item.name,
            },
            unit_amount: item.price * 100,
          },
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
          },
          quantity: item.qty,
        };
      }),

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    };

    const session = await stripe.checkout.sessions.create(params);

    res.status(200).json(session.id);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.message);
  }
});

app.listen(PORT, () => console.log("Server is running at port : " + PORT));
