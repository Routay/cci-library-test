import express from 'express';
// Importe la fonction login que nous venons d'écrire dans le contrôleur
import { login, register } from '../controllers/authController.js'; 

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

export default router;