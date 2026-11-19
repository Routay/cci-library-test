import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';

// ── GET /api/logs ── liste des logs (super_admin) ──────────
export const getLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const total = await ActivityLog.countDocuments();
  
  const logs = await ActivityLog.find()
    .populate('adminId', 'nom prenom email')
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ logs, total });
});
