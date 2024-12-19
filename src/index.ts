import { connect } from "./db/posgres";
import express, { query } from "express";
import user from "./routes/User.Routes";
import category from "./routes/Category.Routes";
import products from "./routes/Products.Routes";
import carts from "./routes/Carts.Routes";
import shippingAddress from "./routes/Address.Routes";
import orders from "./routes/Order.Routes"
import payments from "./routes/Payments.Routes"
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();

connect(); // This will connect to the database
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:8080', // Replace with your frontend URL
  credentials: true
}));


app.get("/api", (req, res) => {
  res.status(200).json({ message: "Hello World" });
});
app.use("/api", user);
app.use("/api", products);
app.use("/api", category);
app.use("/api", carts); 
app.use("/api", shippingAddress);
app.use("/api", orders);
app.use("/api", payments);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
