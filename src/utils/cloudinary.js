import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadFileOnCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File successfully uploaded on cloudinary", response.url); // here we can get url to store in the database
    console.log("Cloudinary full response", response);
    fs.unlinkSync(localFilePath); // to remove the loclally saved temo files after successful uploading of image
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { UploadFileOnCloudinary };
