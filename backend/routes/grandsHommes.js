import express    from 'express';
import GrandHomme from '../models/GrandHomme.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, adminOnly } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { validate, idParam } from '../middleware/validate.js';

const router = express.Router();

// ══════════════════════════════════════════════════════
//  ROUTES PUBLIQUES
// ══════════════════════════════════════════════════════

// ── GET /api/grands-hommes ── Liste publique (actifs uniquement) ──
router.get('/', asyncHandler(async (req, res) => {
  const hommes = await GrandHomme.find({ actif: true })
    .sort({ ordre: 1, createdAt: -1 });
  res.json({ hommes });
}));

// ══════════════════════════════════════════════════════
//  ROUTES ADMIN (protégées) — AVANT /:id pour éviter conflit
// ══════════════════════════════════════════════════════

// ── GET /api/grands-hommes/admin/all ── Liste admin (tous, y compris inactifs) ──
router.get('/admin/all', protect, adminOnly, asyncHandler(async (req, res) => {
  const hommes = await GrandHomme.find()
    .sort({ ordre: 1, createdAt: -1 });
  res.json({ hommes });
}));

// ── GET /api/grands-hommes/:id ── Détail public ──
router.get('/:id', idParam, validate, asyncHandler(async (req, res) => {
  const homme = await GrandHomme.findById(req.params.id);
  if (!homme) {
    throw new AppError('Personnalité introuvable', 404);
  }
  res.json(homme);
}));

// ── POST /api/grands-hommes ── Créer ──
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const homme = await GrandHomme.create(req.body);

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'CREATE',
    entity: 'GrandHomme',
    details: `Ajout de "${homme.name}" dans les Grands Hommes`,
  });

  res.status(201).json(homme);
}));

// ── PUT /api/grands-hommes/:id ── Modifier ──
router.put('/:id', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const homme = await GrandHomme.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!homme) {
    throw new AppError('Personnalité introuvable', 404);
  }

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'GrandHomme',
    details: `Modification de "${homme.name}"`,
  });

  res.json(homme);
}));

// ── PATCH /api/grands-hommes/:id/toggle ── Activer/Désactiver ──
router.patch('/:id/toggle', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const homme = await GrandHomme.findById(req.params.id);
  if (!homme) {
    throw new AppError('Personnalité introuvable', 404);
  }

  homme.actif = !homme.actif;
  await homme.save();

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'GrandHomme',
    details: `${homme.actif ? 'Activation' : 'Désactivation'} de "${homme.name}"`,
  });

  res.json(homme);
}));

// ── DELETE /api/grands-hommes/:id ── Supprimer ──
router.delete('/:id', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const homme = await GrandHomme.findByIdAndDelete(req.params.id);
  if (!homme) {
    throw new AppError('Personnalité introuvable', 404);
  }

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'DELETE',
    entity: 'GrandHomme',
    details: `Suppression de "${homme.name}" des Grands Hommes`,
  });

  res.json({ message: 'Personnalité supprimée avec succès' });
}));

export default router;
