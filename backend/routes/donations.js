import express from 'express';
import Donation from '../models/Donation.js';
import Book from '../models/Book.js';
import { protect, superAdminOnly } from '../middleware/auth.js';
import { uploadPdf } from '../utils/cloudinary.js';
import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { validate, donationRules, idParam } from '../middleware/validate.js';

const router = express.Router();

// ── POST /api/donations ── Soumettre un don (authentifié) ─────────
router.post('/', protect, donationRules.create, validate, (req, res, next) => {
  // Wrapper multer pour capturer les erreurs d'upload Cloudinary
  uploadPdf.single('pdfFile')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload Cloudinary/Multer:', err.message);
      
      let customMessage = "Une erreur est survenue lors du téléchargement de votre fichier. Veuillez réessayer avec un autre fichier.";
      if (err.message && err.message.toLowerCase().includes('large')) {
        customMessage = "Le fichier PDF sélectionné est trop volumineux. Veuillez choisir un fichier plus léger (Maximum 10 Mo).";
      } else if (err.message && err.message.toLowerCase().includes('format')) {
        customMessage = "Le format du fichier est invalide. Seuls les documents au format PDF sont acceptés pour les dons.";
      }

      return next(new AppError(customMessage, 400));
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  const { donorName, donorPhone, bookTitle, author, description } = req.body;
  const userId = req.user._id;
  const donorEmail = req.user.email; // On utilise l'email du compte

  if (!req.file) {
    throw new AppError("Veuillez joindre le document PDF de l'œuvre pour valider votre don.", 400);
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
}));

// ── GET /api/donations/my-donations ── Lister mes dons ──
router.get('/my-donations', protect, asyncHandler(async (req, res) => {
  const donations = await Donation.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(donations);
}));

// ── GET /api/donations ── Lister tous les dons (admin) ──
router.get('/', protect, superAdminOnly, asyncHandler(async (req, res) => {
  const donations = await Donation.find().sort({ createdAt: -1 });
  res.json(donations);
}));

// ── PATCH /api/donations/:id/status ── Changer le statut (admin) ──────
router.patch('/:id/status', protect, superAdminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    throw new AppError('Donation introuvable.', 404);
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
  
  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'Donation',
    details: `Changement du statut du don "${donation.bookTitle}" (par ${donation.donorName}) vers ${status}`,
  });

  res.json({ message: `Le statut a été mis à jour vers ${status}`, donation });
}));

export default router;
