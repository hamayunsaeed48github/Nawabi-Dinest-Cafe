import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDb = async () => {
  try {
    //console.log(`Connecting to: ${process.env.MONGODB_URI}/${DB_NAME}`);
    // Here is basically mongoose return object
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log("Database is connected!");
  } catch (error) {
    console.log("Database is not connecting...", error);
    process.exit(1);
  }
};

export default connectDb;
