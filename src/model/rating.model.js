import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Rating = mongoose.model("Rating", ratingSchema);
