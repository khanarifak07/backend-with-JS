import multer from "multer";

//multer is used for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  }, //cb is callback as middleware
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }, //cb is callback as middleware
});

export const upload = multer({ storage });
