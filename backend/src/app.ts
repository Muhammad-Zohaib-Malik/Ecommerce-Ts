import express from "express";
import userRoutes from "./routes/user.route.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/v1/user", userRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on localhost ${PORT}`);
  connectDB();
});
