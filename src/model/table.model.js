import mongoose, { Schema } from "mongoose";

const tableSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: Number,
      required: true,
    },
    incomingDate: {
      type: String,
      required: true,
    },
    incomingTime: {
      type: String,
      required: true,
    },
    guestCount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "completed"],
      default: "confirmed",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Table = mongoose.model("Table", tableSchema);
