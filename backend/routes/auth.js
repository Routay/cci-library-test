import express from 'express';
// Importe la fonction login que nous venons d'écrire dans le contrôleur
import { login, register, becomeBenevole } from '../controllers/authController.js'; 
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.put('/become-benevole', protect, becomeBenevole);

export default router;