const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
 
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/auth/google/callback";
const googleClient = googleClientId ? new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri) : null;
 
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
 
async function loginWithGoogleToken(req, res) {
  try {
    const { idToken } = req.body || {};
    if (!googleClient) {
      return res.status(500).json({ success: false, error: "GOOGLE_CLIENT_ID not configured" });
    }
    if (!idToken) {
      return res.status(400).json({ success: false, error: "Missing idToken" });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    const email = String(payload.email || "").trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      const role = mapRoleToClient(existing.role);
      const user = {
        id: String(existing._id),
        email: existing.email,
        firstName: existing.first_name || "",
        lastName: existing.last_name || "",
        role,
        isApproved: true,
        college: existing.college || "",
        department: existing.department || "",
      };
      return res.json({ success: true, user });
    }
    const user = new User({
      first_name: payload.given_name || "",
      last_name: payload.family_name || "",
      email,
      role: "FACULTY",
      college: "",
      department: "",
    });
    await user.save();
    return res.json({
      success: true,
      user: {
        id: String(user._id),
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        role: "faculty",
        isApproved: true,
        college: "",
        department: "",
      },
    });
  } catch {
    return res.status(401).json({ success: false, error: "Invalid Google token" });
  }
}
 
function googleAuthorize(req, res) {
  if (!googleClient) {
    return res.status(500).send("Google OAuth not configured");
  }
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
  });
  return res.redirect(url);
}
 
async function googleCallback(req, res) {
  try {
    if (!googleClient) {
      return res.status(500).send("Google OAuth not configured");
    }
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("Missing code");
    }
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
    const email = String(payload.email || "").trim().toLowerCase();
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        first_name: payload.given_name || "",
        last_name: payload.family_name || "",
        email,
        role: "FACULTY",
        college: "",
        department: "",
      });
      await user.save();
    }
    const role = mapRoleToClient(user.role);
    const params = new URLSearchParams({
      google: "success",
      id: String(user._id),
      email: user.email || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      picture: payload.picture || "",
      role,
    });
    return res.redirect(`${clientUrl}/login?${params.toString()}`);
  } catch {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
    return res.redirect(`${clientUrl}/login?google=error`);
  }
}
 
module.exports = { loginWithGoogleToken, googleAuthorize, googleCallback };
