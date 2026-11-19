import express from 'express';
import User    from '../models/User.js';
import Loan    from '../models/Loan.js';
import { protect, adminOnly } from '../middleware/auth.js';
import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { validate, userRules, idParam } from '../middleware/validate.js';

const router = express.Router();

// ── GET /api/users/me ── récupérer le profil courant ───────────
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  res.json(user);
}));

// ── GET /api/users/stats ── KPI des membres (admin) ───────────
router.get('/stats', protect, adminOnly, asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, actifs, inactifs, newThisMonth, byEtab, bySexe] = await Promise.all([
    User.countDocuments({ role: 'membre' }),
    User.countDocuments({ role: 'membre', actif: true }),
    User.countDocuments({ role: 'membre', actif: false }),
    User.countDocuments({ role: 'membre', createdAt: { $gte: startOfMonth } }),
    User.aggregate([
      { $match: { role: 'membre' } },
      { $group: { _id: '$etablissement', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.aggregate([
      { $match: { role: 'membre' } },
      { $group: { _id: '$sexe', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ total, actifs, inactifs, newThisMonth, byEtab, bySexe });
}));

// ── GET /api/users ── liste des utilisateurs (admin) ───────────
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  // Le super_admin voit tout le monde (membres + admins), un admin ne voit que les membres
  const filter = req.user.role === 'super_admin'
    ? { _id: { $ne: req.user._id } }  // tous sauf lui-même
    : { role: 'membre' };
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();

  // Enrichir chaque user avec le compteur d'emprunts
  const userIds = users.map(u => u._id);
  const loanCounts = await Loan.aggregate([
    { $match: { member: { $in: userIds } } },
    { $group: {
      _id: '$member',
      total: { $sum: 1 },
      actifs: { $sum: { $cond: [{ $eq: ['$status', 'actif'] }, 1, 0] } },
      retard: { $sum: { $cond: [{ $eq: ['$status', 'retard'] }, 1, 0] } },
    }},
  ]);
  const countMap = {};
  loanCounts.forEach(c => { countMap[c._id.toString()] = c; });
  const enriched = users.map(u => ({
    ...u,
    loanStats: countMap[u._id.toString()] || { total: 0, actifs: 0, retard: 0 },
  }));

  res.json({ users: enriched });
}));

// ── POST /api/users ── ajouter un membre/admin (admin/super_admin) ──
router.post('/', protect, adminOnly, userRules.create, validate, asyncHandler(async (req, res) => {
  const { role, password, ...rest } = req.body;
  let newRole = 'membre';

  // Seul le super_admin peut définir un rôle 'admin' ou 'super_admin'
  if (req.user.role === 'super_admin' && (role === 'admin' || role === 'super_admin')) {
    newRole = role;
  }

  const userData = { ...rest, role: newRole };
  
  // Si on crée un admin, on a besoin d'un mot de passe
  if (newRole !== 'membre') {
    if (!password) {
      throw new AppError('Un mot de passe est requis pour un administrateur', 400);
    }
    userData.password = password;
  }

  const user = await User.create(userData);
  
  await ActivityLog.create({
    adminId: req.user._id,
    action: 'CREATE',
    entity: 'User',
    details: `Création de l'utilisateur: ${user.email} (${user.role})`,
  });

  res.status(201).json(user);
}));

// ── PUT /api/users/:id ── modifier un membre (admin) ──────
router.put('/:id', protect, adminOnly, userRules.update, validate, asyncHandler(async (req, res) => {
  // On interdit le changement de rôle et de mot de passe ici
  const { password, role, ...rest } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    rest,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('Membre introuvable', 404);
  }

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    details: `Modification du membre: ${user.email}`,
  });

  res.json(user);
}));

// ── PATCH /api/users/:id/toggle ── activer / désactiver ───
router.patch('/:id/toggle', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('Membre introuvable', 404);
  }
  user.actif = !user.actif;
  await user.save();

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    details: `${user.actif ? 'Activation' : 'Désactivation'} du membre ${user.email}`,
  });

  res.json(user);
}));

// ── GET /api/users/:id/history ── historique des emprunts d'un membre ──
router.get('/:id/history', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new AppError('Membre introuvable', 404);
  }
  const loans = await Loan.find({ member: req.params.id })
    .populate('book', 'title author category')
    .sort({ createdAt: -1 });

  const stats = {
    total: loans.length,
    actifs: loans.filter(l => l.status === 'actif').length,
    enRetard: loans.filter(l => l.status === 'retard').length,
    rendus: loans.filter(l => l.status === 'rendu').length,
    enAttente: loans.filter(l => l.status === 'en_attente').length,
  };

  res.json({ user, loans, stats });
}));

// ── DELETE /api/users/:id ── supprimer un membre ──────
router.delete('/:id', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  // Vérifier qu'il n'a pas d'emprunts actifs
  const activeLoans = await Loan.countDocuments({
    member: req.params.id,
    status: { $in: ['actif', 'retard', 'en_attente'] },
  });
  if (activeLoans > 0) {
    throw new AppError(`Ce membre a ${activeLoans} emprunt(s) en cours. Veuillez les clôturer avant la suppression.`, 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('Membre introuvable', 404);
  }
  // Empêcher la suppression d'un admin
  if (user.role !== 'membre') {
    throw new AppError('Impossible de supprimer un administrateur via cette route', 403);
  }

  await User.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'DELETE',
    entity: 'User',
    details: `Suppression du membre: ${user.email}`,
  });

  res.json({ message: 'Membre supprimé avec succès' });
}));

// ── POST /api/users/partner-request ── Bénévole demande à devenir partenaire ──
router.post('/partner-request', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  
  // Si déjà partenaire ou en attente, on ne fait rien
  if (user.partnerStatus === 'approved' || user.partnerStatus === 'pending') {
    throw new AppError('Demande déjà en cours ou vous êtes déjà partenaire', 400);
  }
  
  user.partnerStatus = 'pending';
  await user.save();
  
  res.json({ message: 'Demande envoyée avec succès', user });
}));

// ── PATCH /api/users/:id/partner-status ── (admin) Approuve/Rejette partenariat ──
router.patch('/:id/partner-status', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const { partnerStatus } = req.body;
  if (!['none', 'pending', 'approved', 'rejected'].includes(partnerStatus)) {
    throw new AppError('Statut invalide', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  
  user.partnerStatus = partnerStatus;
  await user.save();
  
  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    details: `Modification du statut partenaire de ${user.email} vers ${partnerStatus}`,
  });

  res.json({ message: 'Statut mis à jour', user });
}));

export default router;