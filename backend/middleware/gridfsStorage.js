const multer = require("multer");

/**
 * Standard memory storage for Multer.
 * Files are held in memory as buffers and manually streamed to GridFS in the controllers.
 * This is much more stable than multer-gridfs-storage with recent MongoDB drivers.
 */
const storage = multer.memoryStorage();

module.exports = storage;
