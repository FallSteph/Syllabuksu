const express = require("express");
const router = express.Router();
const recaptchaVerify = require("../middleware/recaptcha");
const { login, register } = require("../controllers/authController");
const { loginWithGoogleToken, googleAuthorize, googleCallback } = require("../controllers/googleAuthController");
const { verifyRecaptcha } = require("../controllers/recaptchaController");

router.post("/login", recaptchaVerify, login);
router.post("/register", register);
router.post("/google", loginWithGoogleToken);
router.get("/google/authorize", googleAuthorize);
router.get("/google/callback", googleCallback);
router.post("/recaptcha", verifyRecaptcha);

module.exports = router;
