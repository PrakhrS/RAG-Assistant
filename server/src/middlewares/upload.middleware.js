import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// memoryStorage keeps the file buffer in memory — no disk writes,
// nothing to clean up on failure paths.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    }

    // Accept generic/empty Content-Type only when the extension is .pdf or .docx.
    // Mirrors the extension-based fallback in document.service.js createDocument,
    // which handles curl and Postman sending application/octet-stream for .docx.
    // These two branches must stay in sync — if createDocument's fallback changes,
    // update this filter too.
    if (file.mimetype === 'application/octet-stream' || !file.mimetype) {
      const lower = file.originalname.toLowerCase();
      if (lower.endsWith('.pdf') || lower.endsWith('.docx')) {
        return cb(null, true);
      }
    }

    cb(new ApiError(400, 'Only PDF and DOCX files are supported'));
  },
});

export default upload;
