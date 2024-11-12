import { Item } from "../model/items.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const addItems = asyncHandler(async (req, res) => {
  const { foodName, category, description, price } = req.body;

  if (!foodName || !category || !description || !price) {
    return new ApiError(400, "All Fields are required!");
  }

  const foodImageLocalPath = req.file?.path;

  if (!foodImageLocalPath) {
    throw new ApiError(400, "foodImage path is missing!");
  }

  const foodImage = await uploadOnCloudinary(foodImageLocalPath);

  if (!foodImage?.url || !foodImage?.public_id) {
    throw new ApiError(500, "Failed to upload foodImage");
  }

  const newItem = new Item({
    foodName,
    category,
    description,
    foodImage: foodImage.url || "",
    foodImageId: foodImage.public_id || "",
    price,
    averageRating: 0, // Initial average rating is set to 0
    ratingComment: [], // Initial empty array for comments
  });

  const savedItem = await newItem.save();

  return res
    .status(200)
    .json(new ApiResponse(200, savedItem, "New item created"));
});

const addRatingComment = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { comment, rating } = req.body;

  if (!comment || rating == null) {
    return new ApiError(400, "comments and rating are required!");
  }

  const item = await Item.findById(itemId);
  console.log("item", item);

  if (!item) {
    return new ApiError(400, "Item can not found!");
  }

  const userId = req.user._id;
  console.log("user id", userId);

  item.ratingComment.push({ comment, rating, userId });
  const totalRatings = item.ratingComment.reduce(
    (sum, comment) => sum + comment.rating,
    0
  );
  item.averageRating = totalRatings / item.ratingComment.length;

  if (item.averageRating >= 3) {
    item.isPopular = true;
  } else {
    item.isPopular = false;
  }

  const updateItem = await item.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateItem, "rating and comment added successfully")
    );
});

export { addItems, addRatingComment };
