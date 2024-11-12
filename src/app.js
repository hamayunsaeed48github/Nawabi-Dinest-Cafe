import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// imported router
import userRouter from "./routes/user.route.js";
app.use("/api/v1/user", userRouter);

// items route

import itemsRouter from "./routes/items.route.js";
app.use("/api/v1/items", itemsRouter);

export { app };
