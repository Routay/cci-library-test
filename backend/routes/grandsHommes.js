import express    from 'express';
import GrandHomme from '../models/GrandHomme.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ══════════════════════════════════════════════════════
//  ROUTES PUBLIQUES
// ══════════════════════════════════════════════════════

// ── GET /api/grands-hommes ── Liste publique (actifs uniquement) ──
router.get('/', async (req, res) => {
  try {
    const hommes = await GrandHomme.find({ actif: true })
      .sort({ ordre: 1, createdAt: -1 });
    res.json({ hommes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════
//  ROUTES ADMIN (protégées) — AVANT /:id pour éviter conflit
// ══════════════════════════════════════════════════════

// ── GET /api/grands-hommes/admin/all ── Liste admin (tous, y compris inactifs) ──
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const hommes = await GrandHomme.find()
      .sort({ ordre: 1, createdAt: -1 });
    res.json({ hommes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/grands-hommes/:id ── Détail public ──
router.get('/:id', async (req, res) => {
  try {
    const homme = await GrandHomme.findById(req.params.id);
    if (!homme) {
      return res.status(404).json({ message: 'Personnalité introuvable' });
    }
    res.json(homme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/grands-hommes ── Créer ──
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const homme = await GrandHomme.create(req.body);

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'CREATE',
      entity: 'GrandHomme',
      details: `Ajout de "${homme.name}" dans les Grands Hommes`,
    });

    res.status(201).json(homme);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/grands-hommes/:id ── Modifier ──
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const homme = await GrandHomme.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!homme) {
      return res.status(404).json({ message: 'Personnalité introuvable' });
    }

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'UPDATE',
      entity: 'GrandHomme',
      details: `Modification de "${homme.name}"`,
    });

    res.json(homme);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PATCH /api/grands-hommes/:id/toggle ── Activer/Désactiver ──
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const homme = await GrandHomme.findById(req.params.id);
    if (!homme) {
      return res.status(404).json({ message: 'Personnalité introuvable' });
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/grands-hommes/:id ── Supprimer ──
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const homme = await GrandHomme.findByIdAndDelete(req.params.id);
    if (!homme) {
      return res.status(404).json({ message: 'Personnalité introuvable' });
    }

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'DELETE',
      entity: 'GrandHomme',
      details: `Suppression de "${homme.name}" des Grands Hommes`,
    });

    res.json({ message: 'Personnalité supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
