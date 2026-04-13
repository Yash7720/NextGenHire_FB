/**
 * gridfs.js — GridFSBucket singleton
 *
 * Exposes getGridFS() which returns a ready GridFSBucket.
 * Call initGridFS() once after Mongoose connects (done in server.js).
 * Bucket name: "resumes"  →  MongoDB collections: resumes.files / resumes.chunks
 */

const mongoose = require("mongoose");

let uploadBucket = null;

/**
 * Called once after mongoose.connect() resolves.
 * Sets up the GridFSBuckets on the live connection.
 */
function initGridFS() {
  if (uploadBucket) return; // already initialised
  
  const db = mongoose.connection.db;
  if (!db) throw new Error("[gridfs] Mongoose not yet connected");

  // Single bucket for all uploads (resumes and projects)
  uploadBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });

  console.log("[gridfs] GridFSBucket initialised (bucket: uploads)");
}

/**
 * Returns the GridFSBucket for Resumes.
 */
function getGridFS() {
  if (!uploadBucket) initGridFS();
  return uploadBucket;
}

/**
 * Returns the GridFSBucket for Projects (same as resumes).
 */
function getProjectBucket() {
  if (!uploadBucket) initGridFS();
  return uploadBucket;
}

module.exports = { initGridFS, getGridFS, getProjectBucket };
