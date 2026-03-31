import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import foodRouter from "./routes/food.routes.js";
import orderBillRouter from "./routes/orderBill.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/food", foodRouter);
app.use("/api/v1/bill", orderBillRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.get("/hello", (req, res) => {
  res.send("hello world");
});

export default app;