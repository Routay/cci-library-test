import express from 'express';
import Donation from '../models/Donation.js';
import Book from '../models/Book.js';
import { protect, superAdminOnly } from '../middleware/auth.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

// ── POST /api/donations ── Soumettre un don (public) ─────────
router.post('/', upload.single('pdfFile'), async (req, res) => {
  try {
    const { donorName, donorEmail, donorPhone, bookTitle, author, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Le fichier PDF est manquant.' });
    }

    const pdfUrl = req.file.path; // URL Cloudinary

    const donation = await Donation.create({
      donorName,
      donorEmail,
      donorPhone,
      bookTitle,
      author,
      description,
      pdfUrl,
    });

    res.status(201).json({ message: 'Donation soumise avec succès.', donation });
  } catch (err) {
    console.error('Erreur soumission donation:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/donations ── Lister tous les dons (super_admin) ──
router.get('/', protect, superAdminOnly, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/donations/:id/status ── Changer le statut ──────
router.patch('/:id/status', protect, superAdminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation introuvable.' });
    }

    donation.status = status;
    await donation.save();

    // Si approuvé, on crée automatiquement le livre
    if (status === 'approved') {
      const newBook = new Book({
        title: donation.bookTitle,
        author: donation.author,
        description: donation.description,
        pdfUrl: donation.pdfUrl,
        category: 'Autre', // Catégorie par défaut, l'admin pourra la changer
        stock: 1,
      });
      await newBook.save();
    }

    res.json({ message: `Le statut a été mis à jour vers ${status}`, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
