import bcrypt from "bcryptjs";

import validator from "email-validator";
import asyncHandler from "express-async-handler";
import UserModel from "../models/user.js";
import { generateToken } from "../utils/functions.js";

export const UserController = {
  createUser: asyncHandler(async (req, res) => {
    try {
      if (!req.body.email || !req.body.password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const isValid = validator.validate(req.body.email);
      if (!isValid) {
        res.status(400).json({ message: "Email is not valid" });
        return;
      }

      const user = await UserModel.findOne({ email: req.body.email });
      if (user) {
        return res.status(400).send({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await UserModel.create({
        email: req.body.email,
        password: hashedPassword,
      });
      return res.status(201).json({
        message: "User created!",
      });
    } catch (err) {
      console.log("error: " + err);
      res.status(500).json({
        message: "error server side",
      });
    }
  }),
  userLogin: asyncHandler(async (req, res) => {
    try {
      if (!req.body.email || !req.body.password) {
        return res.status(401).json({
          message: "Email and password are required",
        });
      }
      // check email validation
      const isValid = validator.validate(req.body.email);
      if (!isValid) {
        res.status(400).json({ message: "Email is not valid" });
        return;
      }
      // check if user exists
      const existingUser = await UserModel.findOne({ email: req.body.email });
      if (!existingUser) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }
      // check password
      const result = await bcrypt.compare(
        req.body.password,
        existingUser.password
      );
      if (!result) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }
      res.status(200).json({
        token: generateToken(existingUser),
        expiresIn: 3600,
        userId: existingUser._id,
      });
    } catch (err) {
      console.log("error: " + err);
      res.status(500).json({
        message: "error server side",
      });
    }
  }),
};
