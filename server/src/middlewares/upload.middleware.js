import multer from 'multer';

// memoryStorage keeps the file buffer in memory — no disk writes,
// nothing to clean up on failure paths.
const upload = multer({ storage: multer.memoryStorage() });

export default upload;
