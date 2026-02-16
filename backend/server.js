const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const corsOrigin = process.env.CLIENT_URL || "http://localhost:8080";
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
