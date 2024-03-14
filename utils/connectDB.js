import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Connect to MongoDB
export const connectDb = () =>
  mongoose
    .connect(
      process.env.NODE_ENV === "development"
        ? process.env.MONGODB_URL_DEV
        : process.env.MONGODB_URI_PROD
    )
    .then(() => {
      console.log("Connected to database!");
    })
    .catch(() => {
      console.log("Connection failed!");
    });
