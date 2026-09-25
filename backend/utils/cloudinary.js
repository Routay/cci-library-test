import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Storage pour les images (couvertures, etc.) ──────────
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cci-library',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
  },
});

// ── Storage pour les fichiers PDF (resource_type 'raw') ──
const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cci-library/pdf',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});

// Upload images — limite 10 MB
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Upload PDF — limite 100 MB (Cloudinary paid plan)
export const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

export { cloudinary };
