const User = require("../models/User");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
// const questController = require("./questController");

// Register User
exports.registerUser = async (req, res) => {

  try {

    const { name, email, password } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid Email" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Trigger real-time refresh (new user joined)
    req.app.get("io")?.emit("leaderboardUpdate");

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id:              user._id,
        name:             user.name,
        email:            user.email,
        role:             user.role,
        xp:               user.xp,
        streak:           user.streak,
        coursesCompleted: user.coursesCompleted,
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};

// Firebase Social Login Sync
exports.firebaseLogin = async (req, res) => {
  try {
    const { name, email, firebaseUid, profilePic } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ message: "Firebase UID is required" });
    }

    // 1. Find user by Firebase UID first (most reliable)
    let user = await User.findOne({ firebaseUid });

    // 2. If not found by UID, try finding by Email
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (user) {
      // Update existing user with firebaseUid if they only had email before (Linking)
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
      }
      // Update profile pic if provided and user doesn't have one
      if (profilePic && !user.profilePic) {
        user.profilePic = profilePic;
      }
      await user.save();
    } else {
      // 3. Create new user — Email is still required by the User model
      if (!email) {
        return res.status(400).json({ message: "Email is required to create a new account" });
      }

      user = await User.create({
        name: name || "Warrior",
        email,
        firebaseUid,
        profilePic,
        streak: 1,
        xp: 0,
        role: "student",
      });
    }

    // 3. Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "1d"
    });

    // 4. Trigger 'streak' quest progress (Daily Login)
    const questController = require("./questController");
    await questController.updateQuestProgress(req, user._id, "streak");

    // Trigger real-time refresh (potential new user)
    req.app.get("io")?.emit("leaderboardUpdate");

    res.json({
      message: "Social login successful",
      token,
      user: {
        _id:              user._id,
        name:             user.name,
        email:            user.email,
        role:             user.role,
        xp:               user.xp,
        streak:           user.streak,
        coursesCompleted: user.coursesCompleted,
        profilePic:       user.profilePic
      }
    });

  } catch (error) {
    console.error("[authController] firebaseLogin error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// Login User
exports.loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid Email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "1d"
    });

    // Trigger 'streak' quest progress upon login
    const questController = require("./questController");
    await questController.updateQuestProgress(req, user._id, "streak");

    res.json({
      message: "Login successful",
      token,
      user: {
        _id:              user._id,
        name:             user.name,
        email:            user.email,
        role:             user.role,
        xp:               user.xp,
        streak:           user.streak,
        coursesCompleted: user.coursesCompleted,
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};

// ── Admin Login (Dedicated Collection) ──────────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, isAdmin: true, role: "admin" }, 
      process.env.JWT_SECRET || "secretkey", 
      { expiresIn: "1d" }
    );

    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
        avatar: admin.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      You are receiving this email because you (or someone else) has requested the reset of a password.
      Please click on the following link, or paste this into your browser to complete the process:

      ${resetUrl}

      If you did not request this, please ignore this email and your password will remain unchanged.
    `;

    try {
      // Mock Mode: If credentials are still placeholders, just log the link and return success
      if (process.env.EMAIL_USER === 'your-email@gmail.com' || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-app-password') {
        console.log("-----------------------------------------");
        console.log("MOCK EMAIL SENT (No SMTP configured)");
        console.log(`To: ${user.email}`);
        console.log(`Subject: Password Reset Request`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log("-----------------------------------------");
        
        return res.status(200).json({ 
          success: true, 
          message: "Email sent (MOCK MODE: Link logged to backend console)",
          resetToken: resetToken
        });
      }

      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"NextGenHire" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({ success: true, message: "Email sent", resetToken: resetToken });
    } catch (error) {
      console.error("Email sending failed:", error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Set new password
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};