import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import crypto from "crypto";
import dotenv from "dotenv";
import asyncHandler from "express-async-handler";
import sharp from "sharp";
import PostModel from "../models/post.js";

dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAMEE;
const region = process.env.AWS_BUCKET_REGIONN;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const cloudfront = new CloudFrontClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const sendImageToAWSAndGetImageUrl = async (req) => {
  // Resize the image
  const fileBuffer = await sharp(req.file.buffer)
    .resize({ height: 391, width: 456, fit: "contain" })
    .toBuffer();

  // Configure the upload details to send to S3
  const fileName = generateFileName();
  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: req.file.mimetype,
  };
  // Send the upload to S3
  await s3Client.send(new PutObjectCommand(uploadParams));

  //set the url from cloudfront to expire in 1 minute
  const imageUrl = `https://dpgbwslux0b39.cloudfront.net/${fileName}`;
  const signedUrl = getSignedUrl({
    keyPairId: process.env.CLOUDFRONT_KEYPAIR_ID,
    privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
    url: imageUrl,
    dateLessThan: new Date(Date.now() + 1000 * 60),
  });
  return signedUrl;
};

const deleteImageFromAws = async (existingPost) => {
  const imageName = existingPost.imagePath.split("?")[0].split("/")[3];
  const deleteParams = {
    Bucket: bucketName,
    Key: imageName,
  };
  //delete the image from s3
  await s3Client.send(new DeleteObjectCommand(deleteParams));
  //invalidate the cloudfront cache
  const cfCommand = new CreateInvalidationCommand({
    DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: imageName,
      Paths: {
        Quantity: 1,
        Items: ["/" + imageName],
      },
    },
  });
  await cloudfront.send(cfCommand);
};
export const PostController = {
  getPosts: asyncHandler(async (req, res) => {
    try {
      const pageSize = +req.query.pagesize || 5;
      const currentPage = +req.query.page || 1;
      const fetchedPosts = await PostModel.find()
        .skip(pageSize * (currentPage - 1))
        .limit(pageSize);
      const totolPosts = await PostModel.countDocuments();

      for (let post of fetchedPosts) {
        //set the url from cloudfront to expire in 1 minute
        post.imagePath = getSignedUrl({
          keyPairId: process.env.CLOUDFRONT_KEYPAIR_ID,
          privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
          url: post.imagePath.split("?")[0],
          dateLessThan: new Date(Date.now() + 1000 * 60),
        });
      }

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
      //set the url from cloudfront to expire in 1 minute
      existingPost.imagePath = getSignedUrl({
        keyPairId: process.env.CLOUDFRONT_KEYPAIR_ID,
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
        url: existingPost.imagePath.split("?")[0],
        dateLessThan: new Date(Date.now() + 1000 * 60),
      });
      return res.status(200).json(existingPost);
    } catch (err) {
      return res.status(500).json({ message: "Something went wrong. " + err });
    }
  }),
  createPost: asyncHandler(async (req, res) => {
    try {
      const imagePath = await sendImageToAWSAndGetImageUrl(req);
      const createdPost = await PostModel.create({
        title: req.body.title,
        content: req.body.content,
        imagePath,
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
        if (req.body.title) {
          existingPost.title = req.body.title;
        }
        if (req.body.content) {
          existingPost.content = req.body.content;
        }
        //delete the old image from s3 and cloudfront
        await deleteImageFromAws(existingPost);
        //upload the new image to s3 and get the url
        existingPost.imagePath = await sendImageToAWSAndGetImageUrl(req);
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
          await deleteImageFromAws(existingPost);
        } catch (err) {
          console.log(err);
          return res
            .status(500)
            .json({ message: "Error deleting image from AWS" });
        }
      }

      await existingPost.deleteOne();
      return res.send({ message: "Post Deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Something went wrong. " + err });
    }
  }),
};
