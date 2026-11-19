import AppError from '../utils/AppError.js';

/**
 * ═══════════════════════════════════════════════
 *  Gestionnaire d'erreurs global Express
 * ═══════════════════════════════════════════════
 *
 * Centralise TOUTES les erreurs de l'application :
 * - AppError (erreurs métier → statusCode + message propre)
 * - Erreurs Mongoose (validation, duplicate key, cast)
 * - Erreurs JWT (token invalide / expiré)
 * - Erreurs inattendues (bugs → 500 générique)
 */
const errorHandler = (err, _req, res, _next) => {
  // ── Clone mutable ──────────────────────────
  let error = { ...err, message: err.message, stack: err.stack };

  // ── Mongoose : CastError (mauvais ObjectId) ─
  if (err.name === 'CastError') {
    error = new AppError(`Ressource introuvable (ID invalide : ${err.value})`, 404);
  }

  // ── Mongoose : ValidationError ──────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    error = new AppError(`Erreur de validation : ${messages.join('. ')}`, 422);
  }

  // ── Mongoose : Duplicate key (code 11000) ───
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    error = new AppError(`Ce ${field} est déjà utilisé`, 409);
  }

  // ── JWT : Token invalide ────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token invalide. Veuillez vous reconnecter.', 401);
  }

  // ── JWT : Token expiré ──────────────────────
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Session expirée. Veuillez vous reconnecter.', 401);
  }

  // ── Déterminer le code de statut ────────────
  const statusCode = error.statusCode || err.statusCode || 500;
  const isOperational = error.isOperational || false;

  // ── Log complet en dev, minimal en prod ─────
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ [ERROR]', {
      statusCode,
      message: error.message,
      stack: error.stack,
      isOperational,
    });
  } else {
    // En production, ne logger que les erreurs inattendues
    if (!isOperational) {
      console.error('❌ [UNEXPECTED ERROR]', err);
    }
  }

  // ── Réponse JSON ────────────────────────────
  res.status(statusCode).json({
    message: isOperational || statusCode < 500
      ? error.message
      : 'Une erreur interne est survenue. Veuillez réessayer.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export default errorHandler;
