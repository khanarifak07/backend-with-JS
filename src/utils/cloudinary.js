import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadFileOnCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) {
      throw new Error("Local file path is missing.");
    }
    // Upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File successfully uploaded on cloudinary", response.url);
    console.log("Cloudinary full response", response);
    // Log the file path before unlinking
    console.log("File path to unlink:", localFilePath);
    // Unlink the file locally after successful upload to cloudinary
    fs.unlinkSync(localFilePath.trim());

    return response;
  } catch (error) {
    // Remove the locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath.trim());
    console.error("Error during Cloudinary upload:", error.message);
    return null;
  }
};

export { UploadFileOnCloudinary };
