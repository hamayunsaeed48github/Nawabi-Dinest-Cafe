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
    description: {
      type: String,
      required: true,
    },
    foodImage: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
    },
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
