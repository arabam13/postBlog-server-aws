import express from "express";

import { PostController } from "../controllers/posts.js";
import { checkAuth } from "../middleware/check-auth.js";
import { extractFile } from "../middleware/file.js";

export const postsRoutes = express.Router();

postsRoutes.get("", PostController.getPosts);
postsRoutes.get("/:id", PostController.getPost);

postsRoutes.post("", checkAuth, extractFile, PostController.createPost);
postsRoutes.put("/:id", checkAuth, extractFile, PostController.updatePost);
postsRoutes.delete("/:id", checkAuth, PostController.deletePost);
