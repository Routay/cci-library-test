import express from 'express';
import Book    from '../models/Book.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload, uploadPdf } from '../utils/cloudinary.js';
import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { validate, bookRules, idParam } from '../middleware/validate.js';

const router = express.Router();

// Helper for automatic cover fetching
async function fetchCoverUrl(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author || ''}`);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&fields=items(volumeInfo/imageLinks)`);
    if (res.ok) {
      const data = await res.json();
      const img = data.items?.[0]?.volumeInfo?.imageLinks;
      const url = img?.thumbnail || img?.smallThumbnail || null;
      if (url) {
        return url.replace('zoom=1', 'zoom=2').replace('http://', 'https://');
      }
    }
  } catch (_) {}

  try {
    const query = encodeURIComponent(title);
    const res = await fetch(`https://openlibrary.org/search.json?title=${query}&limit=1&fields=cover_i`);
    if (res.ok) {
      const data = await res.json();
      const coverId = data.docs?.[0]?.cover_i;
      if (coverId) {
        return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
      }
    }
  } catch (_) {}

  return '';
}

// ── GET /api/books ── liste publique avec filtres ─────────
router.get('/', asyncHandler(async (req, res) => {
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
}));

// ── GET /api/books/weekly ── livre de la semaine (public) ──
router.get('/weekly', asyncHandler(async (req, res) => {
  const book = await Book.findOne({ isWeekly: true });
  if (!book) {
    throw new AppError('Aucun livre de la semaine défini', 404);
  }
  res.json(book);
}));

// ── GET /api/books/:id ── détail public ───────────────────
router.get('/:id', idParam, validate, asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    throw new AppError('Livre introuvable', 404);
  }
  res.json(book);
}));

// ── POST /api/books ── créer (admin) ──────────────────────
router.post('/', protect, adminOnly, bookRules.create, validate, asyncHandler(async (req, res) => {
  // Si l'administrateur n'a pas fourni d'image, on la cherche automatiquement
  if (!req.body.cover && req.body.title) {
    const fetchedCover = await fetchCoverUrl(req.body.title, req.body.author);
    if (fetchedCover) {
      req.body.cover = fetchedCover;
    }
  }
  const book = await Book.create(req.body);

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'CREATE',
    entity: 'Book',
    details: `Ajout du livre: "${book.title}"`,
  });

  res.status(201).json(book);
}));

// ── POST /api/books/upload-pdf ── uploader PDF (admin) ────
router.post('/upload-pdf', protect, adminOnly, (req, res, next) => {
  uploadPdf.single('pdfFile')(req, res, (err) => {
    if (err) {
      // Multer file size limit error
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxMB = Math.round(100);
        return next(new AppError(`Le fichier PDF dépasse la limite de taille autorisée (${maxMB} Mo). Veuillez le compresser avant de réessayer.`, 400));
      }
      
      // Cloudinary specific file size error (e.g., 10MB limit on free plan)
      if (err.message && err.message.includes('File size too large')) {
        return next(new AppError("Le fichier PDF dépasse la limite de taille maximale (10 Mo) du serveur. Veuillez le compresser avant de l'importer.", 400));
      }

      // Other upload error
      return next(new AppError("Une erreur inattendue est survenue lors de l'import du document. Veuillez vérifier votre connexion et réessayer.", 400));
    }
    if (!req.file) {
      return next(new AppError('Aucun fichier PDF fourni', 400));
    }
    res.json({ pdfUrl: req.file.path });
  });
});

// ── POST /api/books/upload-cover ── uploader image (admin) ────
router.post('/upload-cover', protect, adminOnly, upload.single('cover'), (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Aucune image fournie', 400));
  }
  res.json({ coverUrl: req.file.path });
});

// ── POST /api/books/upload-back-cover ── uploader page arrière (admin) ────
router.post('/upload-back-cover', protect, adminOnly, upload.single('backCover'), (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Aucune image fournie', 400));
  }
  res.json({ backCoverUrl: req.file.path });
});

// ── PUT /api/books/:id ── modifier (admin) ────────────────
router.put('/:id', protect, adminOnly, bookRules.update, validate, asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!book) {
    throw new AppError('Livre introuvable', 404);
  }

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'Book',
    details: `Modification du livre: "${book.title}"`,
  });

  res.json(book);
}));

// ── PUT /api/books/:id/weekly ── définir livre de la semaine
router.put('/:id/weekly', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  // Retire le statut weekly de tous les livres
  await Book.updateMany({ isWeekly: true }, { isWeekly: false });
  // Définit le nouveau livre de la semaine
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { isWeekly: true },
    { new: true }
  );
  if (!book) {
    throw new AppError('Livre introuvable', 404);
  }

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'UPDATE',
    entity: 'Book',
    details: `Nouveau livre de la semaine: "${book.title}"`,
  });

  res.json(book);
}));

// ── DELETE /api/books/:id ── supprimer (admin) ────────────
router.delete('/:id', protect, adminOnly, idParam, validate, asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    throw new AppError('Livre introuvable', 404);
  }

  await ActivityLog.create({
    adminId: req.user._id,
    action: 'DELETE',
    entity: 'Book',
    details: `Suppression du livre: "${book.title}"`,
  });

  res.json({ message: 'Livre supprimé avec succès' });
}));

export default router;