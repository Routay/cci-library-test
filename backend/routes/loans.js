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

const router = express.Router();

router.get('/test-cron', protect, adminOnly, testCron);
router.post('/public', requestPublicLoan);

router.get('/', protect, adminOnly, getLoans);
router.post('/', protect, adminOnly, createLoanAdmin);
router.patch('/:id/return', protect, adminOnly, markLoanReturned);
router.patch('/:id/extend', protect, adminOnly, extendLoan);
router.put('/:id', protect, adminOnly, updateLoan);
router.delete('/:id', protect, adminOnly, deleteLoan);

export default router;