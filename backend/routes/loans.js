import express from 'express';
import {
  testCron,
  getLoans,
  createLoanAdmin,
  requestPublicLoan,
  markLoanReturned,
  updateLoan,
  extendLoan,
  deleteLoan
} from '../controllers/loanController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate, loanRules, idParam } from '../middleware/validate.js';

const router = express.Router();

router.get('/test-cron', protect, adminOnly, testCron);
router.post('/public', requestPublicLoan);

router.get('/', protect, adminOnly, getLoans);
router.post('/', protect, adminOnly, loanRules.create, validate, createLoanAdmin);
router.patch('/:id/return', protect, adminOnly, idParam, validate, markLoanReturned);
router.patch('/:id/extend', protect, adminOnly, idParam, validate, extendLoan);
router.put('/:id', protect, adminOnly, idParam, validate, updateLoan);
router.delete('/:id', protect, adminOnly, idParam, validate, deleteLoan);

export default router;