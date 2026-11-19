/**
 * Wrapper pour les routes async Express.
 *
 * Enveloppe un handler async et transmet automatiquement les erreurs
 * au middleware d'erreur global, éliminant les blocs try/catch répétitifs.
 *
 * @example
 *   // Avant (verbeux) :
 *   router.get('/', async (req, res) => {
 *     try { ... } catch (err) { res.status(500).json({ message: err.message }); }
 *   });
 *
 *   // Après (propre) :
 *   router.get('/', asyncHandler(async (req, res) => {
 *     ...
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
