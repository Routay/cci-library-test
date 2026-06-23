import express from 'express';
import User    from '../models/User.js';
import Setting from '../models/Setting.js';
import { protect, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// ══════════════════════════════════════════════════════
//  GESTION DES ADMINISTRATEURS (super_admin only)
// ══════════════════════════════════════════════════════

// ── GET /api/admin/admins ── Lister tous les admins ──
router.get('/admins', protect, superAdminOnly, async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/admin/admins ── Créer un nouvel admin ──
router.post('/admins', protect, superAdminOnly, async (req, res) => {
  try {
    const { nom, prenom, email, tel, password, role } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caractères',
      });
    }

    const validRole = role === 'super_admin' ? 'super_admin' : 'admin';

    const admin = await User.create({
      nom,
      prenom,
      email,
      tel,
      password,
      role: validRole,
      actif: true,
    });

    // Retourner sans le mot de passe
    const result = admin.toObject();
    delete result.password;

    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/admin/admins/:id/role ── Changer le rôle ──
router.put('/admins/:id/role', protect, superAdminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    // Empêcher de modifier son propre rôle
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    const admin = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Administrateur introuvable' });
    }

    res.json(admin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/admin/admins/:id/password ── Réinitialiser le mot de passe ──
router.put('/admins/:id/password', protect, superAdminOnly, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caractères',
      });
    }

    const admin = await User.findById(req.params.id).select('+password');
    if (!admin) {
      return res.status(404).json({ message: 'Administrateur introuvable' });
    }

    admin.password = password;
    await admin.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PATCH /api/admin/admins/:id/toggle ── Activer/Désactiver ──
router.patch('/admins/:id/toggle', protect, superAdminOnly, async (req, res) => {
  try {
    // Empêcher de se désactiver soi-même
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Administrateur introuvable' });
    }

    admin.actif = !admin.actif;
    await admin.save();

    const result = admin.toObject();
    delete result.password;

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════
//  PARAMÈTRES SYSTÈME (super_admin only)
// ══════════════════════════════════════════════════════

// ── GET /api/admin/settings ── Lire les paramètres ──
router.get('/settings', protect, superAdminOnly, async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/admin/settings ── Mettre à jour les paramètres ──
router.put('/settings', protect, superAdminOnly, async (req, res) => {
  try {
    const { key, _id, __v, createdAt, updatedAt, ...updates } = req.body;

    const settings = await Setting.findOneAndUpdate(
      { key: 'main' },
      updates,
      { new: true, runValidators: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/admin/change-password ── Changer son propre mot de passe ──
router.put('/change-password', protect, superAdminOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
