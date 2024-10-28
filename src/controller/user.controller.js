import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { sendVerificationEamil } from "../utils/email.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshAccessToken();
    const accessToken = user.generateAccessToken();

    console.log("AccessToken", accessToken);

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while access token aur refresh token is generated"
    );
  }
};
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if ([fullName, email, password].some((feild) => feild?.trim() === "")) {
    throw new ApiError(400, "All Field are Required");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(400, "User with this email is already exist");
  }

  let profileImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.profileImage) &&
    req.files.profileImage.length > 0
  ) {
    profileImageLocalPath = req.files.profileImage[0].path;
  }
  //console.log("profileImageLocalPath", profileImageLocalPath);
  const profileImage = await uploadOnCloudinary(profileImageLocalPath);
  // console.log("profile image", profileImage);

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    fullName,
    email,
    password,
    profileImage: profileImage?.url || "",
    otp,
    otpExpiresAt,
    isVerified: false,
  });

  await sendVerificationEamil(email, otp);

  return (
    res
      .status(201)
      // .cookie("accessToken", accessToken, option)
      // .cookie("refreshToken", refreshToken, option)
      .json(new ApiResponse(200, {}, "verify User"))
  );
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  // Validate input
  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  // Find user by OTP
  const user = await User.findOne({ otp });
  if (!user) {
    throw new ApiError(400, "User not found or OTP is invalid");
  }

  // Check OTP expiration
  if (user.otpExpiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  // Update verification status and remove OTP
  user.isVerified = true;
  user.otp = undefined; // Clear OTP after verification
  user.otpExpiresAt = undefined; // Clear expiration time
  await user.save();

  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Error while registering");
  }

  const option = {
    httpOnly: true,
    secure: true,
  };

  // Respond with success message
  return res
    .status(201)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          createdUser,
          accessToken,
          refreshToken,
        },
        "User verify successfully"
      )
    );
});

export { registerUser, verifyOtp };
