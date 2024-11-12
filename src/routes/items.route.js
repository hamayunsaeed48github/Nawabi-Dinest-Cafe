import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addItems, addRatingComment } from "../controller/items.controller.js";

const router = Router();

router.route("/addItem").post(upload.single("foodImage"), addItems);
router.route("/rating-comment/:itemId").patch(verifyJWT, addRatingComment);

export default router;
