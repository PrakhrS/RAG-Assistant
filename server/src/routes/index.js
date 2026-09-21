import { Router } from 'express';
import upload from '../middlewares/upload.middleware.js';
import {
  uploadDocument,
  getDocumentStatus,
} from '../controllers/document.controller.js';
import { searchDocumentChunks } from '../controllers/search.controller.js';
import { ask } from '../controllers/answer.controller.js';


const router = Router();

router.get('/check', (req, res) => {
  res.status(200).json({ message: 'OK' });
});

router.post('/documents', upload.single('file'), uploadDocument);
router.get('/documents/:id', getDocumentStatus);
router.post('/search', searchDocumentChunks);
router.post('/ask', ask);


export default router;
