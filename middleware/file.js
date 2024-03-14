import multer from "multer";
// import { v4 as uuid } from "uuid";

// const MIME_TYPE_MAP = {
//   "image/png": "png",
//   "image/jpeg": "jpg",
//   "image/jpg": "jpg",
// };

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     const isValid = MIME_TYPE_MAP[file.mimetype];
//     if (!isValid) {
//       const error = new Error("Invalid mime type");
//       return callback(error, "./images");
//     }
//     callback(null, "./images");
//   },
//   filename: (req, file, callback) => {
//     const filename = file.originalname.split(" ").join("_");
//     const filenameArray = filename.split(".");
//     filenameArray.pop();
//     const filenameWithoutExtention = filenameArray.join(".");
//     const extension = MIME_TYPE_MAP[file.mimetype];
//     callback(null, filenameWithoutExtention + uuid() + "." + extension);
//   },
// });

// export const extractFile = multer({ storage }).single("image");

const storage = multer.memoryStorage();
export const extractFile = multer({ storage }).single("image");
