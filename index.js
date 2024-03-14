import bodyParser from "body-parser";
import pkg from "cors";
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
const cors = pkg;
app.use(
  cors({
    origin: "*", // Autoriser tous les domaines
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Méthodes autorisées
    allowedHeaders: ["Content-Type", "Authorization"], // En-têtes autorisés
  })
);

//define error express middleware
app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
  return;
});

app.use("/api/users", userRoutes);
app.use("/api/posts", postsRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});
