import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Table } from "../model/table.model.js";
import { Order } from "../model/order.model.js";
import { User } from "../model/user.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { sendVerificationEamil } from "../utils/email.js";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// generate access and refresh token in this function
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

// generate unique OTP in this function
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// here we are registering user
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  // Validate required fields
  if (![fullName, email, password].every((field) => field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  let user = await User.findOne({ email });

  // If user exists and is verified, prevent duplicate registration
  if (user && user.isVerified) {
    throw new ApiError(400, "User with this email already exists");
  }

  // Initialize profile image variables
  let profileImage = { url: "", public_id: "" };

  if (req.files?.profileImage?.length > 0) {
    const profileImageLocalPath = req.files.profileImage[0].path;
    profileImage = await uploadOnCloudinary(profileImageLocalPath);

    if (!profileImage.url || !profileImage.public_id) {
      throw new ApiError(500, "Failed to upload profile image");
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (user) {
    // If user exists but is not verified, update OTP & other details
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.password = password;
    user.profileImage = profileImage.url || user.profileImage;
    user.profileImageId = profileImage.public_id || user.profileImageId;
    await user.save();
  } else {
    // If new user, create account
    user = await User.create({
      fullName,
      email,
      password,
      profileImage: profileImage.url,
      profileImageId: profileImage.public_id,
      otp,
      otpExpiresAt,
      isVerified: false,
    });
  }

  // Send OTP email
  await sendVerificationEamil(email, otp);

  return res
    .status(201)
    .json(new ApiResponse(200, {}, "OTP sent for verification"));
});

// verify OTP in this function
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

// login user in this functiondf
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    throw new ApiError(400, "Email and password is required!");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordIsValid = await user.isPasswordCorrect(password);

  if (!isPasswordIsValid) {
    throw new ApiError(400, "Your password is incorrect");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, option)
    .cookie("accessToken", accessToken, option)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn successfull"
      )
    );
});

// logout user in this function
const loggedOutUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true }
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// access and refresh token in this function
const accessAndRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  console.log("Incoming Refresh Token:", incomingRefreshToken);

  try {
    const isTokenValid = incomingRefreshToken.split(".").length === 3;
    if (!isTokenValid) {
      throw new ApiError(400, "Malformed refresh token");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "Invalid refreshToken");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "Refresh Token is expired or used");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    console.error("Error in accessing refresh token:", error); // Log the error
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// change current password in this function
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Your old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse("your password is changed", {}, 200));
});

// update profile image in this function
const updateProfileImage = asyncHandler(async (req, res) => {
  const profileImageLocalPath = req.file?.path;

  if (!profileImageLocalPath) {
    throw new ApiError(400, "Profile path is missing!");
  }

  const profileImage = await uploadOnCloudinary(profileImageLocalPath);

  if (!profileImage.url || !profileImage.public_id) {
    throw new ApiError(400, "Profile url is missing");
  }

  const userId = await User.findById(req.user?._id);

  if (userId.profileImageId) {
    await deleteFromCloudinary(userId.profileImageId);
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profileImage: profileImage.url,
        profileImageId: profileImage.public_id,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile image updated successfully"));
});

// update profile in this function
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, contact, location } = req.body;

  if (!fullName || !contact || !location) {
    throw new ApiError(400, "All Fields are required!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        contact: contact,
        location: location,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Update Your Profile"));
});

// get current user in this function
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetch Successfully"));
});

// forgot password in this function
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User with this email do not exist!");
  }

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const existedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        otp: otp,
        otpExpiresAt: otpExpiresAt,
        isVerified: false,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  await sendVerificationEamil(email, otp);

  return res.status(200).json(new ApiResponse(200, {}, "Verify User"));
});

// continue with google in this function
const continueWithGoogle = asyncHandler(async (req, res) => {
  const { fullName, email, profileImage } = req.body;

  const user = await User.findOne({ email });

  // profileImage = await uploadOnCloudinary(profileImage);

  // if (!profileImage.url || !profileImage.public_id) {
  //   throw new ApiError(500, "Failed to upload profile image");
  // }

  if (!user) {
    const registerUser = await User.create({
      fullName,
      email,
      password: "",
      profileImage: profileImage || "",
      profileImageId: "",
      isVerified: true,
    });

    const { refreshToken, accessToken } =
      await generateAccessTokenAndRefreshToken(registerUser._id);

    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          { registerUser, accessToken, refreshToken },
          "User Register successfully"
        )
      );
  }

  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User loggedIn successfully"
      )
    );
});

// get order history in this function
const getOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Assume we are passing userId as a parameter

  // Find the user by ID and populate the orderHistory with the order details
  const user = await User.findById(userId)
    .populate({
      path: "orderHistory",
      populate: {
        path: "items.itemId", // Populate the item details
        select: "foodName foodImage price", // Select only the fields we need from the Item model
      },
    })
    .exec();

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Calculate total price for each order
  user.orderHistory.forEach((order) => {
    let orderTotalPrice = 0;
    order.items.forEach((orderItem) => {
      const itemTotalPrice = orderItem.itemId.price * orderItem.quantity;
      orderTotalPrice += itemTotalPrice;
    });
    order.totalPrice = orderTotalPrice;
  });

  res
    .status(200)
    .json(new ApiResponse(200, user.orderHistory, "Order history retrieved"));
});

// delete user account in this function
const deleteUserAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Optionally delete related data
  await Order.deleteMany({ userId }); // Delete all orders associated with this user
  await Table.deleteMany({ userId }); // Delete all table bookings associated with this user

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "User account and related data deleted successfully."
      )
    );
});

const genAI = new GoogleGenerativeAI(process.env.OPEN_AI_API_KEY);

const chatWithGpt = asyncHandler(async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400);
    throw new Error("Prompt is required");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // or gemini-2.5-flash if enabled
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    res.status(500);
    throw new Error("Failed to fetch response from Gemini API");
  }
});

export {
  registerUser,
  verifyOtp,
  loginUser,
  loggedOutUser,
  accessAndRefreshToken,
  changeCurrentPassword,
  updateProfileImage,
  updateProfile,
  getCurrentUser,
  forgotPassword,
  continueWithGoogle,
  getOrderHistory,
  deleteUserAccount,
  chatWithGpt,
};
