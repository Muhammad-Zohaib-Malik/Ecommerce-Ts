import express from "express";
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on localhost ${PORT}`);
  connectDB();
});
