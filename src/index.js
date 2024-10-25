import connectDb from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running on port: ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("Error", error);
      throw err;
    });
    app.get("/", (req, res) => {
      res.send("hello");
    });
  })
  .catch((err) => {
    console.log(`Mongodb connection is failed: ${err}`);
  });
