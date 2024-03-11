import bodyParser from "body-parser";
import express from "express";
import path from "path";
import { postsRoutes } from "./routes/posts.js";
import { userRoutes } from "./routes/user.js";
import { connectDb } from "./utils/connectDB.js";

export const app = express();

// define body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/images", express.static(path.join("images")));

// Connect to MongoDB
connectDb();

// define CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

//define error express middleware
app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
  return;
});

app.use("/api/users", userRoutes);
app.use("/api/posts", postsRoutes);
