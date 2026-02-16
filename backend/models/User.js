const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  employee_id: String,
  first_name: String,
  last_name: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  password_hash: String,
  role: {
    type: String,
    enum: ["FACULTY", "DEPT_HEAD", "DEAN", "CITL", "VPAA", "ADMIN"]
  },
  college: { type: String, default: "" },
  department: { type: String, default: "" },
  status: {
    type: String,
    enum: ["ACTIVE", "ARCHIVED"],
    default: "ACTIVE"
  },
  is_active: { type: Boolean, default: true },
  last_login: { type: Date, default: null },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
