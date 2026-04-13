const mongoose  = require("mongoose");
const { Readable } = require("stream");
const Application = require("../models/Application");
const Job         = require("../models/Job");
const User        = require("../models/User");
const { getGridFS } = require("../config/gridfs");

// ─── Helper: broadcast refresh signal ─────────────────────────────────────────
function emitRefresh(req) {
  const io = req.app.get("io");
  if (io) io.emit("leaderboardUpdate");
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications/apply
// Accepts multipart/form-data with optional file field "resume".
// Streams file into GridFS, saves resumeFileId + filename on the application.
// ─────────────────────────────────────────────────────────────────────────────
exports.applyJob = async (req, res) => {
  try {
    // req.body contains text fields (jobId, applicantName, email, userId, …)
    // req.file (if present) is the uploaded resume from resumeUpload middleware
    const { jobId, applicantName, email, userId, status, resume } = req.body;

    if (!jobId || !applicantName || !email) {
      return res.status(400).json({
        success: false,
        error: "jobId, applicantName, and email are required."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a resume (PDF or ZIP) to apply for this job."
      });
    }

    let resumeFileId = null;
    let filename     = null;

    // ── Manual Streaming to GridFS — Using shared "uploads" bucket ──────────
    if (req.file) {
      const gfs = getGridFS();
      const readableStream = new Readable();
      readableStream.push(req.file.buffer);
      readableStream.push(null);

      const uploadStream = gfs.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
      });

      resumeFileId = uploadStream.id;
      filename     = req.file.originalname;

      readableStream.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on("error", (err) => {
          console.error("[applicationController] GridFS upload error:", err);
          reject(err);
        });
        uploadStream.on("finish", resolve);
      });

      console.log(`[applicationController] Resume stored in GridFS: id=${resumeFileId}, file=${filename}`);
    }

    // ── Create application document ───────────────────────────────────────────
    const application = await Application.create({
      jobId,
      applicantName,
      email,
      userId: userId || undefined,
      status: status || "pending",
      resume: resume || undefined,
      resumeFileId,
      filename
    });

    // ── Increment job applicant counter ───────────────────────────────────────
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });
    }

    // ── Update User's appliedJobs list ─────────────────────────────────────────
    if (userId) {
      await User.findByIdAndUpdate(userId, { $addToSet: { appliedJobs: String(jobId) } });
    }

    // ── Trigger quest progress ────────────────────────────────────────────────
    const questController = require("./questController");
    if (userId) {
      await questController.updateQuestProgress(req, userId, "application");
    }

    emitRefresh(req);

    res.status(201).json({
      message: "Application submitted successfully",
      application
    });

  } catch (error) {
    console.error("[applicationController] applyJob error:", error.message);

    // Multer file too large
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "File too large. Maximum size is 10 MB." });
    }
    // Multer wrong type
    if (error.message?.includes("Invalid file type")) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications
// Fetch all applications (for admin dashboard).
// ─────────────────────────────────────────────────────────────────────────────
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find().populate("jobId");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/user/:userId
// Per-user applications (for student dashboard).
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[applicationController] getUserApplications: Fetching for userId=${userId}`);

    const User = require("../models/User");
    const userDoc = await User.findById(userId);

    const query = {
      $or: [
        { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId },
        ...(userDoc?.email ? [{ email: userDoc.email }] : [])
      ]
    };

    console.log(`[applicationController] Query: ${JSON.stringify(query)}`);
    const data = await Application.find(query).populate("jobId");
    console.log(`[applicationController] Found: ${data.length} records`);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/applications/:id/status
// Update application status.
// ─────────────────────────────────────────────────────────────────────────────
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
    if (!application) return res.status(404).json({ success: false, error: "Not found" });

    const io = req.app.get("io");
    if (io && application.userId) {
      io.to(application.userId.toString()).emit("applicationStatusUpdate", {
        applicationId: id,
        status
      });
    }
    emitRefresh(req);
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/download/:id
// Admin downloads the resume for a given application.
// Streams the file from GridFS — no buffering in memory on the server.
// ─────────────────────────────────────────────────────────────────────────────
exports.downloadResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid application ID." });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found." });
    }

    if (!application.resumeFileId) {
      return res.status(404).json({ success: false, error: "No resume on file for this application." });
    }

    const gfs      = getGridFS();
    const fileId   = new mongoose.Types.ObjectId(application.resumeFileId);

    // Verify file exists in GridFS
    const files = await gfs.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, error: "Resume file not found in storage." });
    }

    const file = files[0];

    // Determine Content-Type
    const ext = (application.filename || "").split(".").pop().toLowerCase();
    const contentType =
      ext === "pdf" ? "application/pdf" :
      ext === "zip" ? "application/zip" :
      file.contentType || "application/octet-stream";

    const safeFilename = encodeURIComponent(application.filename || `resume_${id}`);

    res.set({
      "Content-Type":        contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Content-Length":      file.length
    });

    // Stream from GridFS → response (no buffer)
    const downloadStream = gfs.openDownloadStream(fileId);
    downloadStream.on("error", (err) => {
      console.error("[applicationController] GridFS stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Error streaming file." });
      }
    });
    downloadStream.pipe(res);

  } catch (error) {
    console.error("[applicationController] downloadResume error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/applications/application/:id
// Admin deletes an application and its associated GridFS file.
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid application ID." });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found." });
    }

    // Delete the GridFS file if one exists
    if (application.resumeFileId) {
      try {
        const gfs    = getGridFS();
        const fileId = new mongoose.Types.ObjectId(application.resumeFileId);
        await gfs.delete(fileId);
        console.log(`[applicationController] Deleted GridFS file: ${fileId}`);
      } catch (gridErr) {
        // Log but don't block — the application doc should still be removed
        console.warn(`[applicationController] Could not delete GridFS file: ${gridErr.message}`);
      }
    }

    await Application.findByIdAndDelete(id);
    emitRefresh(req);

    res.json({ success: true, message: "Application and resume deleted successfully." });
  } catch (error) {
    console.error("[applicationController] deleteApplication error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};