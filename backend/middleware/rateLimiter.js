import rateLimit from 'express-rate-limit';

/**
 * ═══════════════════════════════════════════════
 *  Rate Limiters — Protection anti-abus
 * ═══════════════════════════════════════════════
 *
 * Trois niveaux de limitation selon la sensibilité des routes :
 *
 * 1. authLimiter   → Routes d'authentification (brute-force)
 * 2. apiLimiter    → Routes API générales (écritures, mutations)
 * 3. publicLimiter → Routes publiques (lecture, consultation)
 */

// ── Auth : 10 tentatives / 15 min par IP ─────────────────
// Protège /api/auth/login et /api/auth/admin-login du brute-force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },
  // Ignore les requêtes réussies (ne compte que les échecs)
  skipSuccessfulRequests: true,
});

// ── API : 100 requêtes / 15 min par IP ───────────────────
// Pour les routes sensibles (POST, PUT, DELETE)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Trop de requêtes. Veuillez patienter quelques minutes.',
  },
});

// ── Public : 200 requêtes / 15 min par IP ────────────────
// Pour les routes de consultation (GET publics)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Trop de requêtes. Veuillez patienter quelques minutes.',
  },
});
