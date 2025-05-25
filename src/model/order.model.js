import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Delivered"],
      default: "Confirmed",
    },
    paymentMethod: {
      type: String,
      enum: ["CashOnDelivery", "Stripe"],
      required: true,
    },
    paymentId: {
      type: String, // To store Stripe payment intent ID
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
