import express from 'express';
import User     from '../models/User.js';
import Loan     from '../models/Loan.js';
import Donation from '../models/Donation.js';
import { protect, superAdminOnly } from '../middleware/auth.js';
import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// ── GET /api/benevoles ── Liste enrichie des bénévoles (admin) ──
router.get('/', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const members = await User.find({ role: 'membre', isBenevole: true })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  const memberIds = members.map(m => m._id);

  // Emprunts par membre
  const loanAgg = await Loan.aggregate([
    { $match: { member: { $in: memberIds } } },
    { $group: {
      _id: '$member',
      totalLoans:  { $sum: 1 },
      activeLoans: { $sum: { $cond: [{ $eq: ['$status', 'actif'] }, 1, 0] } },
      lateLoans:   { $sum: { $cond: [{ $eq: ['$status', 'retard'] }, 1, 0] } },
      returned:    { $sum: { $cond: [{ $eq: ['$status', 'rendu'] }, 1, 0] } },
      pending:     { $sum: { $cond: [{ $eq: ['$status', 'en_attente'] }, 1, 0] } },
    }},
  ]);

  // Dons par membre
  const donationAgg = await Donation.aggregate([
    { $match: { userId: { $in: memberIds } } },
    { $group: {
      _id: '$userId',
      totalDonations:    { $sum: 1 },
      approvedDonations: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
      pendingDonations:  { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      rejectedDonations: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
    }},
  ]);

  const loanMap = {};
  loanAgg.forEach(c => { loanMap[c._id.toString()] = c; });

  const donMap = {};
  donationAgg.forEach(c => { donMap[c._id.toString()] = c; });

  // Score d'activité = totalLoans + (approvedDonations * 3) + (returned * 0.5)
  const enriched = members.map(m => {
    const loans = loanMap[m._id.toString()] || { totalLoans: 0, activeLoans: 0, lateLoans: 0, returned: 0, pending: 0 };
    const dons  = donMap[m._id.toString()]  || { totalDonations: 0, approvedDonations: 0, pendingDonations: 0, rejectedDonations: 0 };

    const activityScore = loans.totalLoans + (dons.approvedDonations * 3) + (loans.returned * 0.5);

    return {
      ...m,
      loanStats:    loans,
      donationStats: dons,
      activityScore: Math.round(activityScore * 10) / 10,
    };
  });

  res.json({ members: enriched });
}));

// ── GET /api/benevoles/stats ── KPI globaux bénévoles (admin) ──
router.get('/stats', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek  = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [total, actifs, inactifs, newThisMonth, newThisWeek, withLoans, withDonations] = await Promise.all([
    User.countDocuments({ role: 'membre', isBenevole: true }),
    User.countDocuments({ role: 'membre', isBenevole: true, actif: true }),
    User.countDocuments({ role: 'membre', isBenevole: true, actif: false }),
    User.countDocuments({ role: 'membre', isBenevole: true, createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'membre', isBenevole: true, createdAt: { $gte: startOfWeek } }),
    Loan.distinct('member').then(ids => ids.length),
    Donation.distinct('userId').then(ids => ids.length),
  ]);

  res.json({ total, actifs, inactifs, newThisMonth, newThisWeek, withLoans, withDonations });
}));

// ── DELETE /api/benevoles/bulk ── Suppression en masse (admin) ──
router.delete('/bulk', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Aucun ID fourni', 400);
  }

  // Vérifier qu'aucun n'a d'emprunts actifs
  const activeLoans = await Loan.countDocuments({
    member: { $in: ids },
    status: { $in: ['actif', 'retard', 'en_attente'] },
  });
  if (activeLoans > 0) {
    throw new AppError(
      `${activeLoans} emprunt(s) en cours empêche(nt) la suppression. Clôturez-les d'abord.`,
      400
    );
  }

  // Ne supprimer que les membres bénévoles (pas les admins)
  const result = await User.deleteMany({ _id: { $in: ids }, role: 'membre', isBenevole: true });
  
  await ActivityLog.create({
    adminId: req.user._id,
    action: 'DELETE',
    entity: 'User',
    details: `Suppression en masse de ${result.deletedCount} bénévole(s)`,
  });

  res.json({ message: `${result.deletedCount} compte(s) supprimé(s)`, deletedCount: result.deletedCount });
}));

// ── PATCH /api/benevoles/bulk-toggle ── Bloquer/débloquer en masse ──
router.patch('/bulk-toggle', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const { ids, actif } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Aucun ID fourni', 400);
  }

  const result = await User.updateMany(
    { _id: { $in: ids }, role: 'membre', isBenevole: true },
    { $set: { actif } }
  );

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    details: `${actif ? 'Activation' : 'Désactivation'} en masse de ${result.modifiedCount} bénévole(s)`,
  });

  res.json({ message: `${result.modifiedCount} compte(s) mis à jour`, modifiedCount: result.modifiedCount });
}));

export default router;
