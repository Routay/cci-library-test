import express from 'express';
import Book    from '../models/Book.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/books ── liste publique avec filtres ─────────
router.get('/', async (req, res) => {
  try {
    const { search, category, available, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search)               query.$text = { $search: search };
    if (category)             query.category = category;
    if (available === 'true') query.stock = { $gt: 0 };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      books,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/books/weekly ── livre de la semaine (public) ──
router.get('/weekly', async (req, res) => {
  try {
    const book = await Book.findOne({ isWeekly: true });
    if (!book) {
      return res.status(404).json({ message: 'Aucun livre de la semaine défini' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/books/:id ── détail public ───────────────────
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/books ── créer (admin) ──────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/books/:id ── modifier (admin) ────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/books/:id/weekly ── définir livre de la semaine
router.put('/:id/weekly', protect, adminOnly, async (req, res) => {
  try {
    // Retire le statut weekly de tous les livres
    await Book.updateMany({ isWeekly: true }, { isWeekly: false });
    // Définit le nouveau livre de la semaine
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { isWeekly: true },
      { new: true }
    );
    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/books/:id ── supprimer (admin) ────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livre introuvable' });
    }
    res.json({ message: 'Livre supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;