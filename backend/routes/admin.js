import express from 'express';
import User    from '../models/User.js';
import Setting from '../models/Setting.js';
import { protect, superAdminOnly } from '../middleware/auth.js';
import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { validate, adminRules, idParam } from '../middleware/validate.js';

const router = express.Router();

// ══════════════════════════════════════════════════════
//  GESTION DES ADMINISTRATEURS (super_admin only)
// ══════════════════════════════════════════════════════

// ── GET /api/admin/admins ── Lister tous les admins ──
router.get('/admins', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const admins = await User.find({
    role: { $in: ['admin', 'super_admin'] },
  })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ admins });
}));

// ── POST /api/admin/admins ── Créer un nouvel admin ──
router.post('/admins', protect, superAdminOnly, adminRules.createAdmin, validate, asyncHandler(async (req, res) => {
  const { nom, prenom, email, tel, password, role } = req.body;

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

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'CREATE',
    entity: 'User',
    details: `Création de l'administrateur: ${email} (${validRole})`,
  });

  res.status(201).json(result);
}));

// ── PUT /api/admin/admins/:id/role ── Changer le rôle ──
router.put('/admins/:id/role', protect, superAdminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'super_admin'].includes(role)) {
    throw new AppError('Rôle invalide', 400);
  }

  // Empêcher de modifier son propre rôle
  if (req.params.id === req.user._id.toString()) {
    throw new AppError('Vous ne pouvez pas modifier votre propre rôle', 400);
  }

  const admin = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!admin) {
    throw new AppError('Administrateur introuvable', 404);
  }

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    details: `Modification du rôle de l'administrateur ${admin.email} vers ${role}`,
  });

  res.json(admin);
}));

// ── PUT /api/admin/admins/:id/password ── Réinitialiser le mot de passe ──
router.put('/admins/:id/password', protect, superAdminOnly, adminRules.resetPassword, validate, asyncHandler(async (req, res) => {
  const { password } = req.body;

  const admin = await User.findById(req.params.id).select('+password');
  if (!admin) {
    throw new AppError('Administrateur introuvable', 404);
  }

  admin.password = password;
  await admin.save();

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    details: `Réinitialisation du mot de passe de l'administrateur ${admin.email}`,
  });

  res.json({ message: 'Mot de passe réinitialisé avec succès' });
}));

// ── PATCH /api/admin/admins/:id/toggle ── Activer/Désactiver ──
router.patch('/admins/:id/toggle', protect, superAdminOnly, idParam, validate, asyncHandler(async (req, res) => {
  // Empêcher de se désactiver soi-même
  if (req.params.id === req.user._id.toString()) {
    throw new AppError('Vous ne pouvez pas désactiver votre propre compte', 400);
  }

  const admin = await User.findById(req.params.id);
  if (!admin) {
    throw new AppError('Administrateur introuvable', 404);
  }

  admin.actif = !admin.actif;
  await admin.save();

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    details: `${admin.actif ? 'Activation' : 'Désactivation'} du compte administrateur ${admin.email}`,
  });

  const result = admin.toObject();
  delete result.password;

  res.json(result);
}));

// ══════════════════════════════════════════════════════
//  PARAMÈTRES SYSTÈME (super_admin only)
// ══════════════════════════════════════════════════════

// ── GET /api/admin/settings/public ── Paramètres publics (no auth) ──
router.get('/settings/public', asyncHandler(async (req, res) => {
  const settings = await Setting.getSettings();
  res.json({
    libraryName: settings.libraryName,
    libraryDescription: settings.libraryDescription,
    openingHours: settings.openingHours,
    address: settings.address,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    footerDescription: settings.footerDescription,
    loanDurationDays: settings.loanDurationDays,
  });
}));

// ── GET /api/admin/settings ── Lire les paramètres ──
router.get('/settings', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const settings = await Setting.getSettings();
  res.json(settings);
}));

// ── PUT /api/admin/settings ── Mettre à jour les paramètres ──
router.put('/settings', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const { key, _id, __v, createdAt, updatedAt, ...updates } = req.body;

  const settings = await Setting.findOneAndUpdate(
    { key: 'main' },
    updates,
    { new: true, runValidators: true, upsert: true }
  );

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'Setting',
    details: `Mise à jour des paramètres système`,
  });

  res.json(settings);
}));

// ── PUT /api/admin/change-password ── Changer son propre mot de passe ──
router.put('/change-password', protect, superAdminOnly, adminRules.changePassword, validate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Mot de passe actuel incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Mot de passe modifié avec succès' });
}));

export default router;
