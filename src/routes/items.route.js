import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addItems,
  addRatingComment,
  getItemByCategoryAndSubCategory,
  getPopularItemByCategory,
  updateItemImage,
  updateItem,
  deleteItem,
} from "../controller/items.controller.js";

const router = Router();

router.route("/addItem").post(upload.single("foodImage"), addItems);
router.route("/rating-comment/:itemId").patch(verifyJWT, addRatingComment);
router.route("/items-by-category").post(getItemByCategoryAndSubCategory);
router.route("/popular-items").post(getPopularItemByCategory);
router
  .route("/update-item-image/:itemId")
  .patch(upload.single("foodImage"), updateItemImage);
router.route("/update-item/:itemId").patch(updateItem);
router.route("/delete-item/:itemId").delete(deleteItem);

export default router;
