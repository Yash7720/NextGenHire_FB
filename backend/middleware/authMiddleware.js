const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

/**
 * protect — verify JWT and attach req.user
 *
 * Expects:  Authorization: Bearer <token>
 * On fail:  401 Unauthorized
 */
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    let token = "";

    if (header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: "No token provided (header or query)" });
    }

    const secret  = process.env.JWT_SECRET || "secretkey";
    const decoded = jwt.verify(token, secret);

    let user;
    if (decoded.isAdmin) {
      user = await Admin.findById(decoded.id).select("-password");
    } else {
      user = await User.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

/**
 * admin — check if the user has admin role
 */
exports.admin = (req, res, next) => {
  console.log(`[debug] admin middleware check: user role = ${req.user ? req.user.role : "None"}`);
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, error: "Access denied. Admin role required." });
  }
};

/**
 * optionalAuth — same as protect but does NOT block if no token is present.
 * Useful for GET routes that are public but benefit from knowing who's asking.
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return next();

    const token   = header.split(" ")[1];
    const secret  = process.env.JWT_SECRET || "secretkey";
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select("-password");
    if (user) req.user = user;
  } catch {
    // ignore — just proceed without req.user
  }
  next();
};

// Optimize error handling in auth controllers

// Refactor route structure for better scalability

// Optimize error handling in auth controllers

// Refactor route structure for better scalability
