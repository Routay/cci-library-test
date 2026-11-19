import { body, param, query, validationResult } from 'express-validator';

/**
 * ═══════════════════════════════════════════════
 *  Validation des inputs — express-validator
 * ═══════════════════════════════════════════════
 *
 * Chaque groupe exporte un tableau de règles à utiliser comme middleware.
 *
 * Usage :
 *   import { validate, authRules } from '../middleware/validate.js';
 *   router.post('/login', authRules.login, validate, loginController);
 */

// ── Middleware runner : collecte les erreurs et renvoie 422 ──
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(422).json({
      message: 'Erreur de validation',
      errors: messages,
    });
  }
  next();
};

// ═══════════════════════════════════════════════
//  Règles par domaine
// ═══════════════════════════════════════════════

// ── Auth ─────────────────────────────────────
export const authRules = {
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage("L'email est requis")
      .isEmail().withMessage("Format d'email invalide")
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Le mot de passe est requis'),
  ],

  register: [
    body('nom')
      .trim()
      .notEmpty().withMessage('Le nom est requis')
      .isLength({ min: 2, max: 50 }).withMessage('Le nom doit faire entre 2 et 50 caractères'),
    body('prenom')
      .trim()
      .notEmpty().withMessage('Le prénom est requis')
      .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit faire entre 2 et 50 caractères'),
    body('email')
      .trim()
      .notEmpty().withMessage("L'email est requis")
      .isEmail().withMessage("Format d'email invalide")
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Le mot de passe est requis')
      .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
      .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
      .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre')
      .matches(/[@$!%*?&.]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&.)'),
    body('tel')
      .optional()
      .trim(),
    body('sexe')
      .optional()
      .isIn(['', 'M', 'F']).withMessage('Sexe invalide'),
    body('etablissement')
      .optional()
      .isIn(['', 'Université', 'École de formation', 'Institut', 'Autre']).withMessage('Établissement invalide'),
  ],
};

// ── Books ────────────────────────────────────
export const bookRules = {
  create: [
    body('titre')
      .trim()
      .notEmpty().withMessage('Le titre est requis')
      .isLength({ max: 200 }).withMessage('Le titre ne doit pas dépasser 200 caractères'),
    body('auteur')
      .trim()
      .notEmpty().withMessage("L'auteur est requis"),
    body('categorie')
      .optional()
      .trim(),
    body('langue')
      .optional()
      .isIn(['Français', 'Arabe', 'Anglais', '']).withMessage('Langue invalide'),
    body('quantite')
      .optional()
      .isInt({ min: 0 }).withMessage('La quantité doit être un nombre positif'),
  ],

  update: [
    param('id')
      .isMongoId().withMessage('ID de livre invalide'),
    body('titre')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Le titre ne doit pas dépasser 200 caractères'),
    body('quantite')
      .optional()
      .isInt({ min: 0 }).withMessage('La quantité doit être un nombre positif'),
  ],
};

// ── Users ────────────────────────────────────
export const userRules = {
  create: [
    body('nom').trim().notEmpty().withMessage('Le nom est requis'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
    body('email')
      .trim()
      .notEmpty().withMessage("L'email est requis")
      .isEmail().withMessage("Format d'email invalide")
      .normalizeEmail(),
    body('tel').optional().trim(),
  ],

  update: [
    param('id').isMongoId().withMessage("ID d'utilisateur invalide"),
    body('email')
      .optional()
      .isEmail().withMessage("Format d'email invalide")
      .normalizeEmail(),
  ],
};

// ── Loans ────────────────────────────────────
export const loanRules = {
  create: [
    body('bookId')
      .notEmpty().withMessage('Le livre est requis')
      .isMongoId().withMessage('ID de livre invalide'),
    body('memberId')
      .notEmpty().withMessage('Le membre est requis')
      .isMongoId().withMessage('ID de membre invalide'),
  ],
};

// ── Admin ────────────────────────────────────
export const adminRules = {
  createAdmin: [
    body('nom').trim().notEmpty().withMessage('Le nom est requis'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
    body('email')
      .trim()
      .notEmpty().withMessage("L'email est requis")
      .isEmail().withMessage("Format d'email invalide")
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Le mot de passe est requis')
      .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('role')
      .optional()
      .isIn(['admin', 'super_admin']).withMessage('Rôle invalide'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Le mot de passe actuel est requis'),
    body('newPassword')
      .notEmpty().withMessage('Le nouveau mot de passe est requis')
      .isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
  ],

  resetPassword: [
    param('id').isMongoId().withMessage("ID d'administrateur invalide"),
    body('password')
      .notEmpty().withMessage('Le mot de passe est requis')
      .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  ],
};

// ── Donations ────────────────────────────────
export const donationRules = {
  create: [
    body('titre')
      .trim()
      .notEmpty().withMessage('Le titre du livre est requis'),
    body('auteur')
      .trim()
      .notEmpty().withMessage("L'auteur est requis"),
    body('quantite')
      .optional()
      .isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  ],
};

// ── Paramètre ID commun ─────────────────────
export const idParam = [
  param('id').isMongoId().withMessage('ID invalide'),
];
