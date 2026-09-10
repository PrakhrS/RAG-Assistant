import { Router } from 'express';
import upload from '../middlewares/upload.middleware.js';
import {
  uploadDocument,
  getDocumentStatus,
} from '../controllers/document.controller.js';

const router = Router();

router.get('/check', (req, res) => {
  res.status(200).json({ message: 'OK' });
});

router.post('/documents', upload.single('file'), uploadDocument);
router.get('/documents/:id', getDocumentStatus);

export default router;
