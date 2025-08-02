import {
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
} from "../controller/user.controller.js";
import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/register")
  .post(upload.fields([{ name: "profileImage", maxCount: 1 }]), registerUser);
router.route("/verifyOtp").post(verifyOtp);
router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyJWT, loggedOutUser);
router.route("/refreshToken").post(accessAndRefreshToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router
  .route("/profile-image")
  .patch(verifyJWT, upload.single("profileImage"), updateProfileImage);

router.route("/update-profile").patch(verifyJWT, updateProfile);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/forgot-password").post(forgotPassword);

router
  .route("/contine-google")
  .post(upload.single("profileImage"), continueWithGoogle);

router.route("/get-order-history").get(verifyJWT, getOrderHistory);

router.route("/delete-account").delete(verifyJWT, deleteUserAccount);

router.route("/chat-with-gpt").post(chatWithGpt);

export default router;
