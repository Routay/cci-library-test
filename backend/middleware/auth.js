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