import express from 'express';
import Book    from '../models/Book.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload, uploadPdf } from '../utils/cloudinary.js';

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
    // Si l'administrateur n'a pas fourni d'image, on la cherche automatiquement
    if (!req.body.cover && req.body.title) {
      const fetchedCover = await fetchCoverUrl(req.body.title, req.body.author);
      if (fetchedCover) {
        req.body.cover = fetchedCover;
      }
    }
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── POST /api/books/upload-pdf ── uploader PDF (admin) ────
router.post('/upload-pdf', protect, adminOnly, (req, res) => {
  uploadPdf.single('pdfFile')(req, res, (err) => {
    if (err) {
      // Multer file size limit error
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxMB = Math.round(100);
        return res.status(400).json({
          message: `Le fichier PDF dépasse la limite de taille autorisée (${maxMB} Mo). Veuillez le compresser avant de réessayer.`,
          error_code: 'FILE_TOO_LARGE'
        });
      }
      
      // Cloudinary specific file size error (e.g., 10MB limit on free plan)
      if (err.message && err.message.includes('File size too large')) {
        return res.status(400).json({
          message: "Le fichier PDF dépasse la limite de taille maximale (10 Mo) du serveur. Veuillez le compresser avant de l'importer.",
          error_code: 'FILE_TOO_LARGE'
        });
      }

      // Other upload error
      return res.status(400).json({
        message: "Une erreur inattendue est survenue lors de l'import du document. Veuillez vérifier votre connexion et réessayer.",
        error_details: err.message,
        error_code: 'UPLOAD_ERROR'
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }
    res.json({ pdfUrl: req.file.path });
  });
});

// ── POST /api/books/upload-cover ── uploader image (admin) ────
router.post('/upload-cover', protect, adminOnly, upload.single('cover'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image fournie' });
  }
  res.json({ coverUrl: req.file.path });
});

// ── POST /api/books/upload-back-cover ── uploader page arrière (admin) ────
router.post('/upload-back-cover', protect, adminOnly, upload.single('backCover'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image fournie' });
  }
  res.json({ backCoverUrl: req.file.path });
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