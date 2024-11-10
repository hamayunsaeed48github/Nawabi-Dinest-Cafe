import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { loadEnvFile } from "process";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
  secure: true, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("response", response);

    fs.unlinkSync(localFilePath);
    return {
      url: response.secure_url,
      public_id: response.public_id,
    };
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log("error", error);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    const response = await cloudinary.uploader.destroy(publicId);

    return response;
  } catch (error) {
    console.log("Delete error:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
