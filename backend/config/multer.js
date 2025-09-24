// config/multer.js
import multer from "multer";

// Memory storage: file buffers are kept in memory (good for streaming to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
