/**
 * Classe d'erreur applicative centralisée.
 *
 * Permet de distinguer les erreurs "opérationnelles" (prévisibles : 400, 404, 409…)
 * des erreurs "inattendues" (bugs, pannes…) dans le gestionnaire global.
 *
 * @example
 *   throw new AppError('Livre introuvable', 404);
 *   throw new AppError('Email déjà utilisé', 409);
 */
export default class AppError extends Error {
  /**
   * @param {string} message  – Message d'erreur lisible
   * @param {number} statusCode – Code HTTP (400, 401, 403, 404, 409, 422, 500…)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distingue les erreurs métier des crashes
    Error.captureStackTrace(this, this.constructor);
  }
}
