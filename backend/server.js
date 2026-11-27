import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import loanRoutes from './routes/loans.js';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import logRoutes from './routes/logs.js';
import adminRoutes from './routes/admin.js';
import grandsHommesRoutes from './routes/grandsHommes.js';
import aiRoutes from './routes/ai.js';
import donationsRoutes from './routes/donations.js';
import reportRoutes from './routes/report.js';
import messagesRoutes from './routes/messages.js';
import benevolesRoutes from './routes/benevoles.js';
import { startCronJobs } from './services/cron.js';
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares ───────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────
// Origines autorisées (liste statique + regex)
const ALLOWED_ORIGINS_EXACT = [
  'https://cci-library-test.vercel.app', // ancien domaine Vercel
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
];

// Accepte bibliothequecci.com avec ou sans www, en http ou https
const ALLOWED_ORIGIN_REGEX = /^https?:\/\/(www\.)?bibliothequecci\.com$/;

function isOriginAllowed(origin) {
  if (!origin) return true;                              // Postman / server-to-server
  if (ALLOWED_ORIGIN_REGEX.test(origin)) return true;   // *.bibliothequecci.com
  if (ALLOWED_ORIGINS_EXACT.includes(origin)) return true;
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqué : ${origin}`);
      callback(new Error(`CORS bloqué pour : ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(morgan('dev'));

// ── Rate limiting global ──────────────────────────────────
app.use('/api/', apiLimiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/grands-hommes', grandsHommesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/benevoles', benevolesRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date() })
);

// ── Gestion des erreurs globale (centralisée) ────────────
app.use(errorHandler);

// ── Connexion MongoDB puis démarrage ──────────────────────
mongoose
  .connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cci-bibliotheque')
  .then(() => {
    console.log('✅ MongoDB connecté');
    startCronJobs();
    app.listen(PORT, () =>
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  });