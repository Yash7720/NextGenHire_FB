const express = require("express");
const router = express.Router();

const { registerUser, loginUser, firebaseLogin, adminLogin, forgotPassword, resetPassword } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin-login", adminLogin);
router.post("/firebase-login", firebaseLogin);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;