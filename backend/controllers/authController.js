const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Missing credentials" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }
    if (!user.password_hash) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }
    const approvedRoles = ["FACULTY", "DEPT_HEAD", "DEAN", "CITL", "VPAA", "ADMIN"];
    const role = user.role && approvedRoles.includes(user.role) ? user.role : "FACULTY";
    const payload = { sub: String(user._id), email: user.email, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
    const clientRoleMap = {
      FACULTY: "faculty",
      DEPT_HEAD: "dept_head",
      DEAN: "dean",
      CITL: "citl",
      VPAA: "vpaa",
      ADMIN: "admin",
    };
    const clientUser = {
      id: String(user._id),
      email: user.email,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      role: clientRoleMap[role] || "faculty",
      isApproved: true,
      college: "",
      department: "",
    };
    return res.json({ success: true, token, user: clientUser });
  } catch {
    return res.status(500).json({ success: false, error: "Login failed" });
  }
}

async function register(req, res) {
  try {
    const { firstName, lastName, email, password, role, college, department } = req.body || {};
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }
    const roleMap = {
      faculty: "FACULTY",
      dept_head: "DEPT_HEAD",
      dean: "DEAN",
      citl: "CITL",
      vpaa: "VPAA",
      admin: "ADMIN",
    };
    const dbRole = roleMap[role] || "FACULTY";
    if (["FACULTY", "DEPT_HEAD", "DEAN"].includes(dbRole)) {
      if (!college || !department) {
        return res.status(400).json({ success: false, error: "College and department are required for this role" });
      }
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const user = new User({
      first_name: firstName,
      last_name: lastName,
      email: normalizedEmail,
      password_hash,
      role: dbRole,
      college: college || "",
      department: department || "",
    });
    await user.save();
    const clientUser = {
      id: String(user._id),
      email: user.email,
      firstName,
      lastName,
      role,
      isApproved: true,
      college: user.college,
      department: user.department,
    };
    return res.status(201).json({ success: true, user: clientUser });
  } catch {
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
}

module.exports = { login, register };
