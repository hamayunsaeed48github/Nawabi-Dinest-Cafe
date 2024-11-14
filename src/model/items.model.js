import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema(
  {
    foodName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    foodImage: {
      type: String,
      required: true,
    },
    foodImageId: {
      type: String,
    },
    price: {
      type: String,
      required: true,
    },
    ratingComment: [
      {
        comment: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          default: 0,
        },
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    averageRating: {
      type: Number,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Item = mongoose.model("Item", itemSchema);
