import express from 'express';
import User    from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/users ── liste des utilisateurs (admin) ───────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    // Le super_admin voit tout le monde (membres + admins), un admin ne voit que les membres
    const filter = req.user.role === 'super_admin'
      ? { _id: { $ne: req.user._id } }  // tous sauf lui-même
      : { role: 'membre' };
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users });
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

export default router;