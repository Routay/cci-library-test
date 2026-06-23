import ActivityLog from '../models/ActivityLog.js';

// ── GET /api/logs ── liste des logs (super_admin) ──────────
export const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const total = await ActivityLog.countDocuments();
    
    const logs = await ActivityLog.find()
      .populate('adminId', 'nom prenom email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
