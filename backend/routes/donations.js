import express from 'express';
import Donation from '../models/Donation.js';
import Book from '../models/Book.js';
import { protect, superAdminOnly } from '../middleware/auth.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

// ── POST /api/donations ── Soumettre un don (authentifié) ─────────
router.post('/', protect, (req, res, next) => {
  // Wrapper multer pour capturer les erreurs d'upload Cloudinary
  upload.single('pdfFile')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload Cloudinary/Multer:', err.message);
      console.error('❌ Détails complets:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      return res.status(500).json({ message: `Erreur upload fichier: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { donorName, donorPhone, bookTitle, author, description } = req.body;
    const userId = req.user._id;
    const donorEmail = req.user.email; // On utilise l'email du compte

    if (!req.file) {
      return res.status(400).json({ message: 'Le fichier PDF est manquant.' });
    }

    console.log('✅ Fichier uploadé:', req.file.path);
    const pdfUrl = req.file.path; // URL Cloudinary

    const donation = await Donation.create({
      userId,
      donorName: donorName || req.user.prenom + ' ' + req.user.nom,
      donorEmail,
      donorPhone,
      bookTitle,
      author,
      description,
      pdfUrl,
    });

    res.status(201).json({ message: 'Donation soumise avec succès.', donation });
  } catch (err) {
    console.error('❌ Erreur soumission donation:', err.message);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/donations/my-donations ── Lister mes dons ──
router.get('/my-donations', protect, async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
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
    const { status, rejectionReason } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation introuvable.' });
    }

    donation.status = status;
    if (status === 'rejected' && rejectionReason) {
      donation.rejectionReason = rejectionReason;
    }
    
    await donation.save();

    // Si approuvé, on crée automatiquement le livre
    if (status === 'approved') {
      const newBook = new Book({
        title: donation.bookTitle,
        author: donation.author,
        description: donation.description,
        pdfUrl: donation.pdfUrl,
        category: 'Autre', // Catégorie par défaut, l'admin pourra la changer
        stock: 0,
      });
      await newBook.save();
    }

    res.json({ message: `Le statut a été mis à jour vers ${status}`, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
