import mongoose, { Schema } from "mongoose";

const tableSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Table = mongoose.model("Table", tableSchema);
