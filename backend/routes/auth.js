import express from 'express';
// Importe la fonction login que nous venons d'écrire dans le contrôleur
import { login } from '../controllers/authController.js'; 

const router = express.Router();

// Cette ligne relie l'URL "/api/auth/login" à la fonction login()
router.post('/login', login);

export default router;