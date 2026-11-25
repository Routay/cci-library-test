import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

// Vérifie que le token JWT est valide
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé — token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// Réserve l'accès aux admins et super_admins
export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
};

// Réserve l'accès aux super_admins uniquement
export const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ message: 'Accès réservé au Super Administrateur' });
};

// ── Gardien du compte maître ──────────────────────────────────
// Bloque toute tentative de modification ou suppression du
// compte isMasterAdmin via l'API, peu importe qui en fait la demande.
export const protectMasterAdmin = async (req, res, next) => {
  try {
    const User = (await import('../models/User.js')).default;
    // Vérifie la cible par ID (routes /:id)
    if (req.params && req.params.id) {
      const target = await User.findById(req.params.id).select('isMasterAdmin email');
      if (target && target.isMasterAdmin) {
        return res.status(403).json({
          message: 'Ce compte est protégé et ne peut pas être modifié ou supprimé.'
        });
      }
    }
    // Vérifie aussi si la requête cible l'email du maître directement
    const MASTER_EMAIL = 'manetahirou215@gmail.com';
    if (req.body && req.body.email && req.body.email.toLowerCase() === MASTER_EMAIL) {
      return res.status(403).json({
        message: 'Ce compte est protégé et ne peut pas être modifié.'
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};