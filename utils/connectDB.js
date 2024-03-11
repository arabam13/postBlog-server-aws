import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Connect to MongoDB
export const connectDb = () =>
  mongoose
    .connect(process.env.MONGODB_URL_DEV)
    .then(() => {
      console.log("Connected to database!");
    })
    .catch(() => {
      console.log("Connection failed!");
    });
