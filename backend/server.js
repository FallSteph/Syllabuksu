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

const User = require("./models/User");
async function ensureUserFields() {
  try {
    const now = new Date();
    await User.updateMany({ is_active: { $exists: false } }, { $set: { is_active: true } });
    await User.updateMany({ updated_at: { $exists: false } }, { $set: { updated_at: now } });
    await User.updateMany({ last_login: { $exists: false } }, { $set: { last_login: null } });
    await User.updateMany({ status: { $exists: false } }, { $set: { status: "ACTIVE" } });
    console.log("User fields ensured");
  } catch (e) {
    console.warn("ensureUserFields failed:", e?.message || e);
  }
}

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("MongoDB connected");
    ensureUserFields();
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
