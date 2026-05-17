const mongoose     = require("mongoose");
const { Readable } = require("stream");
const Project      = require("../models/Project");
const User         = require("../models/User");
const { getProjectBucket } = require("../config/gridfs");

/**
 * submitProject — POST /api/submit-project
 * Handles multipart upload of a ZIP project to GridFS.
 */
exports.submitProject = async (req, res) => {
  try {
    console.log("[debug] submitProject hit! Body:", req.body);
    console.log("[debug] submitProject File:", req.file ? { name: req.file.originalname, size: req.file.size } : "No file");
    
    const { studentId, userId, projectTitle, description, techStack, courseId, liveLink, githubLink } = req.body;
    const effectiveStudentId = studentId || userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: "Please upload a .zip file." });
    }

    if (!effectiveStudentId || !projectTitle || !description || !githubLink) {
      return res.status(400).json({ success: false, error: "Missing required project details (studentId, title, description, and GitHub link required)." });
    }

    // 1. Prepare techStack array (parse if it's a string)
    let processedStack = [];
    if (Array.isArray(techStack)) {
      processedStack = techStack;
    } else if (typeof techStack === "string") {
      processedStack = techStack.split(",").map(s => s.trim()).filter(Boolean);
    }

    // 2. Manual Streaming to GridFS
    const bucket = getProjectBucket();
    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });

    const fileId = uploadStream.id;

    readableStream.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on("error", reject);
      uploadStream.on("finish", resolve);
    });

    const filename = file.originalname;
    const fileSize = file.size;

    console.log(`[projectController] Project stored in GridFS: id=${fileId}, file=${filename}`);

    // 3. Create Project Record
    const project = await Project.create({
      studentId: effectiveStudentId,
      projectTitle,
      description,
      techStack: processedStack,
      fileId,
      filename,
      fileSize,
      courseId: courseId || "general",
      liveLink,
      githubLink,
      zipFile: `gridfs/${fileId}` // placeholder for legacy UI compatibility
    });

    // 4. Award XP (+100) and update user status
    await User.findByIdAndUpdate(effectiveStudentId, { $inc: { xp: 100 } });

    // 5. Emit real-time update for Admin panel
    const io = req.app.get("io");
    if (io) {
      io.emit("projectUpdate", { 
        studentId: effectiveStudentId, 
        projectTitle 
      });
      io.emit("leaderboardUpdate");
    }

    res.status(201).json({
      success: true,
      message: "Project submitted successfully! +100 XP awarded.",
      project
    });
  } catch (err) {
    console.error("[projectController] submitProject:", err.message);
    res.status(500).json({ success: false, error: "Failed to upload project." });
  }
};

/**
 * getProjects — GET /api/projects
 * Fetches all project submissions (Admin typically).
 */
exports.getProjects = async (req, res) => {
  try {
    console.log(`[debug] Project model collection: ${Project.collection.name}`);
    console.log(`[debug] Connection database: ${mongoose.connection.name}`);
    
    const rawProjects = await Project.find()
      .sort({ uploadedAt: -1 })
      .populate("studentId", "name email xp avatar")
      .lean();
    
    console.log(`[debug] Found ${rawProjects.length} raw projects`);
    

    // Failsafe: If populate failed for some reason, manually lookup users
    const projects = await Promise.all(
      rawProjects.map(async (p) => {
        // If studentId is still a plain ID string/ObjectId (not an object with name), lookup manually
        if (p.studentId && (typeof p.studentId === "string" || mongoose.Types.ObjectId.isValid(p.studentId)) && !p.studentId.name) {
          const user = await User.findById(p.studentId).select("name email xp avatar").lean();
          if (user) {
            return { ...p, studentId: user };
          }
        }
        return p;
      })
    );

    res.status(200).json({ 
      success: true, 
      count: projects.length, 
      projects 
    });
  } catch (err) {
    console.error("[projectController] getAdminProjects:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * downloadProject — GET /api/download-project/:id
 * Streams the ZIP file from GridFS to the browser.
 */
exports.downloadProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found." });
    }

    const bucket = getProjectBucket();
    
    // Set response headers for download
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${project.filename}"`,
      "Content-Length": project.fileSize
    });

    const downloadStream = bucket.openDownloadStream(project.fileId);

    downloadStream.on("error", (err) => {
      res.status(404).send("File not found in storage.");
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error("[projectController] downloadProject:", err.message);
    res.status(500).json({ success: false, error: "Download failed." });
  }
};

/**
 * deleteProject — DELETE /api/project/:id
 * Removes document and associated chunks from GridFS.
 */
exports.deleteProject = async (req, res) => {
  try {
    console.log(`[debug] deleteProject called for ID: ${req.params.id}`);
    console.log(`[debug] req.user: ${req.user ? req.user.email : "No User"} Role: ${req.user ? req.user.role : "N/A"}`);
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found." });
    }

    // Delete chunks and metadata from GridFS
    const bucket = getProjectBucket();
    try {
      await bucket.delete(project.fileId);
    } catch (gfsErr) {
      console.warn("[projectController] GridFS file delete failed (may have been missing):", gfsErr.message);
    }

    // Delete the project document
    await project.deleteOne();

    console.log(`[debug] Project ${req.params.id} deleted successfully from DB.`);

    // Trigger real-time refresh
    req.app.get("io")?.emit("leaderboardUpdate");

    res.status(200).json({ success: true, message: "Project deleted successfully." });
  } catch (err) {
    console.error("[projectController] deleteProject:", err.message);
    res.status(500).json({ success: false, error: "Delete failed." });
  }
};

// Update project submission endpoints - update 3

// Implement AI chatbot logic - update 8

// Update application models and schemas - update 13

// Add error handling for application routes - update 18

// Refactor prompt generation for Gemini API - update 23

// Refactor controller logic for scalability - update 28
