import { connect } from "./db/posgres";
import express from "express";
import user from "./routes/User.Routes";
import category from "./routes/Category.Routes";
import products from "./routes/Products.Routes";
import carts from "./routes/Carts.Routes";
import shippingAddress from "./routes/Address.Routes";
import orders from "./routes/Order.Routes"
import payments from "./routes/Payments.Routes"
import cookieParser from "cookie-parser";
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
dotenv.config()

const app = express();

connect(); // This will connect to the database
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({
  origin: ['http://localhost:8080', process.env.LOVABLE_URL, process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

app.get("/", (req, res) => {
  res.status(200).json({ message: "API ECOMMERCE" });
});
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
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
// //port to listen
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

export default app;