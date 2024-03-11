import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import PostModel from "../models/post.js";

export const PostController = {
  getPosts: asyncHandler(async (req, res) => {
    try {
      const pageSize = +req.query.pagesize || 5;
      const currentPage = +req.query.page || 1;
      const fetchedPosts = await PostModel.find()
        .skip(pageSize * (currentPage - 1))
        .limit(pageSize);
      const totolPosts = await PostModel.countDocuments();

      return res.status(200).json({
        message: "Posts fetched successfully!",
        posts: fetchedPosts,
        maxPosts: totolPosts,
      });
    } catch (err) {
      return res.status(500).json({ message: "Something went wrong. " + err });
    }
  }),
  getPost: asyncHandler(async (req, res) => {
    try {
      const existingPost = await PostModel.findById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      return res.status(200).json(existingPost);
    } catch (err) {
      return res.status(500).json({ message: "Something went wrong. " + err });
    }
  }),
  createPost: asyncHandler(async (req, res) => {
    try {
      const url = req.protocol + "://" + req.get("host");
      const createdPost = await PostModel.create({
        title: req.body.title,
        content: req.body.content,
        imagePath: url + "/images/" + req.file.filename,
        creator: req.userData.userId,
      });
      return res.status(201).json({
        message: "Post added successfully",
        post: {
          ...createdPost._doc,
          id: createdPost._id,
        },
      });
    } catch (error) {
      console.log("error: ", error);
      res.status(500).json({
        message: "Creating a post failed!",
      });
    }
  }),
  updatePost: asyncHandler(async (req, res) => {
    try {
      const existingPost = await PostModel.findById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Book not found" });
      }
      if (existingPost.creator.toString() !== req.userData.userId.toString()) {
        return res
          .status(403)
          .json({ message: "You are not authorized to update" });
      }

      if (req.file) {
        const url = req.protocol + "://" + req.get("host");
        const imagePath = url + "/images/" + req.file.filename;
        if (req.body.title) {
          existingPost.title = req.body.title;
        }
        if (req.body.content) {
          existingPost.content = req.body.content;
        }
        existingPost.imagePath = imagePath;
      } else {
        if (req.body.title) {
          existingPost.title = req.body.title;
        }
        if (req.body.content) {
          existingPost.content = req.body.content;
        }
      }
      existingPost.save();
      return res.status(200).json({ message: "Update successful!" });
    } catch (error) {
      console.log("error: ", error);
      return res.status(500).json({
        message: "error server side",
      });
    }
  }),
  deletePost: asyncHandler(async (req, res) => {
    try {
      const existingPost = await PostModel.findById(req.params.id);
      console.log("existingPost: ", existingPost);
      if (!existingPost) {
        return res.status(404).json({ message: "Book not found" });
      }
      if (existingPost.creator.toString() !== req.userData.userId.toString()) {
        return res
          .status(403)
          .json({ message: "You are not authorized to delete" });
      }
      if (existingPost.imagePath) {
        try {
          fs.unlinkSync(
            path.join(
              process.cwd(),
              existingPost.imagePath.split("/").slice(-2).join("/")
            )
          );
          // console.log("deleted");
        } catch (err) {
          console.log(err);
        }
      }

      await existingPost.deleteOne();
      return res.send({ message: "Post Deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Something went wrong. " + err });
    }
  }),
};
