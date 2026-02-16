const User = require("../models/User");
 
function mapRoleToClient(dbRole) {
  const clientRoleMap = {
    FACULTY: "faculty",
    DEPT_HEAD: "dept_head",
    DEAN: "dean",
    CITL: "citl",
    VPAA: "vpaa",
    ADMIN: "admin",
  };
  return clientRoleMap[dbRole] || "faculty";
}
 
function mapRoleToDb(clientRole) {
  const roleMap = {
    faculty: "FACULTY",
    dept_head: "DEPT_HEAD",
    dean: "DEAN",
    citl: "CITL",
    vpaa: "VPAA",
    admin: "ADMIN",
  };
  return roleMap[clientRole] || "FACULTY";
}
 
function toClientUser(u) {
  return {
    id: String(u._id),
    email: u.email || "",
    firstName: u.first_name || "",
    lastName: u.last_name || "",
    role: mapRoleToClient(u.role),
    isApproved: true,
    college: u.college || "",
    department: u.department || "",
    status: (u.status === "ARCHIVED" ? "archived" : "active"),
    createdAt: new Date(u._id.getTimestamp()).toISOString().split("T")[0],
    notificationsEnabled: true,
  };
}
 
async function listUsers(req, res) {
  try {
    const users = await User.find({}).sort({ last_name: 1, first_name: 1 });
    return res.json({ success: true, users: users.map(toClientUser) });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to load users" });
  }
}
 
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, college, department, status } = req.body || {};
    const update = {};
    if (typeof firstName === "string") update.first_name = firstName;
    if (typeof lastName === "string") update.last_name = lastName;
    if (typeof role === "string") update.role = mapRoleToDb(role);
    if (typeof college === "string") update.college = college;
    if (typeof department === "string") update.department = department;
    if (typeof status === "string") {
      update.status = status.toLowerCase() === "archived" ? "ARCHIVED" : "ACTIVE";
    }
    const u = await User.findByIdAndUpdate(id, update, { new: true });
    if (!u) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    return res.json({ success: true, user: toClientUser(u) });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to update user" });
  }
}
 
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const u = await User.findByIdAndDelete(id);
    if (!u) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete user" });
  }
}
 
module.exports = { listUsers, updateUser, deleteUser };
