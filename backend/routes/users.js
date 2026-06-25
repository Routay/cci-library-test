import express from 'express';
import User    from '../models/User.js';
import Loan    from '../models/Loan.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/users/stats ── KPI des membres (admin) ───────────
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/users ── liste des utilisateurs (admin) ───────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/users ── ajouter un membre/admin (admin/super_admin) ──
router.post('/', protect, adminOnly, async (req, res) => {
  try {
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
        return res.status(400).json({ message: 'Un mot de passe est requis pour un administrateur' });
      }
      userData.password = password;
    }

    const user = await User.create(userData);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/users/:id ── modifier un membre (admin) ──────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    // On interdit le changement de rôle et de mot de passe ici
    const { password, role, ...rest } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      rest,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Membre introuvable' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PATCH /api/users/:id/toggle ── activer / désactiver ───
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Membre introuvable' });
    }
    user.actif = !user.actif;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/users/:id/history ── historique des emprunts d'un membre ──
router.get('/:id/history', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Membre introuvable' });
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/users/:id ── supprimer un membre ──────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    // Vérifier qu'il n'a pas d'emprunts actifs
    const activeLoans = await Loan.countDocuments({
      member: req.params.id,
      status: { $in: ['actif', 'retard', 'en_attente'] },
    });
    if (activeLoans > 0) {
      return res.status(400).json({
        message: `Ce membre a ${activeLoans} emprunt(s) en cours. Veuillez les clôturer avant la suppression.`,
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Membre introuvable' });
    }
    // Empêcher la suppression d'un admin
    if (user.role !== 'membre') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur via cette route' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Membre supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;