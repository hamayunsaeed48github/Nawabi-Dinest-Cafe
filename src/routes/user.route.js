import { registerUser, verifyOtp } from "../controller/user.controller.js";
import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router
  .route("/register")
  .post(upload.fields([{ name: "profileImage", maxCount: 1 }]), registerUser);
router.route("/verifyOtp").post(verifyOtp);

export default router;
