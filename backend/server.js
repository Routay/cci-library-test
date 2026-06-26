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
import { startCronJobs } from './services/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'https://cci-library-test.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqué pour : ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/grands-hommes', grandsHommesRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date() })
);

// ── Gestion des erreurs globale ───────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur interne',
  });
});

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