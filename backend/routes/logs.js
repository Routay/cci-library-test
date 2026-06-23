import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { protect, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, superAdminOnly, getLogs);

export default router;
