import express from "express";

import { UserController } from "../controllers/user.js";

export const userRoutes = express.Router();

userRoutes.post("/signup", UserController.createUser);
userRoutes.post("/login", UserController.userLogin);
