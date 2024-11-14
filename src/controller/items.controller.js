import { Item } from "../model/items.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

// admin pannel controller
const addItems = asyncHandler(async (req, res) => {
  const { foodName, category, subCategory, description, price } = req.body;

  if (!foodName || !category || !subCategory || !description || !price) {
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
    subCategory,
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

const updateItemImage = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const foodImageLocalPath = req.file?.path;

  if (!foodImageLocalPath) {
    throw new ApiError(400, "foodImage path is missing!");
  }

  const foodImage = await uploadOnCloudinary(foodImageLocalPath);

  if (!foodImage.url || !foodImage.public_id) {
    throw new ApiError(400, "Profile url is missing");
  }

  if (itemId.foodImageId) {
    await deleteFromCloudinary(itemId.foodImageId);
  }

  const item = await Item.findByIdAndUpdate(
    itemId,
    {
      $set: {
        foodImage: foodImage.url,
        foodImageId: foodImage.public_id,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, item, "Profile image updated successfully"));
});

const updateItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { foodName, category, subCategory, description, price } = req.body;

  const updatedItem = await Item.findByIdAndUpdate(
    itemId,
    {
      ...(foodName && { foodName }), // Update only if foodName is provided
      ...(category && { category }),
      ...(subCategory && { subCategory }),
      ...(description && { description }),
      ...(price && { price }),
    },
    { new: true, runValidators: true }
  );

  if (!updatedItem) {
    throw new ApiError(404, "Item not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedItem, "Item updated successfully"));
});

const deleteItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const item = await Item.findByIdAndDelete(itemId);

  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Item deleted successfully"));
});

// Mobile App controller
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

const getItemByCategoryAndSubCategory = asyncHandler(async (req, res) => {
  const { category, subCategory } = req.body;

  if (!category || !subCategory) {
    return new ApiError(400, "Category and SubCategory is required");
  }

  const items = await Item.find({ category, subCategory });

  if (items.length === 0) {
    return res
      .status(404)
      .json(
        new ApiError(404, "No item found of this category and subCategory")
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, items, "Items retrieved successfully"));
});

const getPopularItemByCategory = asyncHandler(async (req, res) => {
  const { category } = req.body;
  if (!category) {
    return new ApiError(400, "Category is required");
  }

  const items = await Item.find({ category, isPopular: true });

  if (items.length === 0) {
    return res.status(404).json(new ApiError(404, "No popular items found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        items,
        `Popular item of ${category} retrieved successfully`
      )
    );
});

export {
  addItems,
  addRatingComment,
  getItemByCategoryAndSubCategory,
  getPopularItemByCategory,
  updateItemImage,
  updateItem,
  deleteItem,
};
