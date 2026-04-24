require("dotenv").config();
const mongoose = require("mongoose");

console.log("Testing MongoDB connection to:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  family: 4,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log("SUCCESS: Connected to MongoDB");
  process.exit(0);
})
.catch((err) => {
  console.error("FAILURE: Connection error details:");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  process.exit(1);
});
