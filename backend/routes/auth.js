import express from 'express';
import { login, adminLogin, register, becomeBenevole } from '../controllers/authController.js'; 
import { protect } from '../middleware/auth.js';
import { validate, authRules } from '../middleware/validate.js';

const router = express.Router();

router.post('/login',       authRules.login,    validate, login);
router.post('/admin-login',  authRules.login,    validate, adminLogin);
router.post('/register',     authRules.register, validate, register);
router.put('/become-benevole', protect, becomeBenevole);

export default router;