import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 5000;

app.get("/user", (req, res) => {
  res.send("hello world");
});
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });