import express from 'express';
import Message from '../models/Message.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { validate, idParam } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = express.Router();

const validateMessage = [
  body('content').notEmpty().withMessage('Le contenu du message est obligatoire').trim(),
];

// ── POST /api/messages ── Envoyer un message ─────────
router.post('/', protect, validateMessage, validate, asyncHandler(async (req, res) => {
  const { content, relatedDonationId, receiverId } = req.body;
  
  // Si l'utilisateur est admin, il répond à un utilisateur
  const isAdminSender = req.user.role === 'admin' || req.user.role === 'super_admin';
  
  let actualReceiverId = receiverId;
  // Si un membre envoie, il n'a pas forcément de receiverId (envoyé aux admins par défaut)
  // Mais on peut le laisser à null pour indiquer "support général"
  
  const message = await Message.create({
    senderId: req.user._id,
    receiverId: actualReceiverId || null,
    isAdminSender,
    content,
    relatedDonationId: relatedDonationId || null,
  });

  res.status(201).json(message);
}));

// ── GET /api/messages/my-conversation ── Récupérer la conversation d'un bénévole ──
router.get('/my-conversation', protect, asyncHandler(async (req, res) => {
  // Tous les messages où je suis l'expéditeur ou le destinataire
  const messages = await Message.find({
    $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
  })
  .populate('senderId', 'nom prenom role')
  .populate('receiverId', 'nom prenom role')
  .sort({ createdAt: 1 });
  
  res.json(messages);
}));

// ── GET /api/messages/admin/conversations ── Récupérer toutes les conversations (Admin) ──
router.get('/admin/conversations', protect, adminOnly, asyncHandler(async (req, res) => {
  const messages = await Message.find()
    .populate('senderId', 'nom prenom email partnerStatus')
    .populate('receiverId', 'nom prenom email')
    .populate('relatedDonationId', 'bookTitle status')
    .sort({ createdAt: -1 });
  
  // On pourrait grouper par utilisateur côté frontend ou ici.
  res.json(messages);
}));

// ── PATCH /api/messages/:id/read ── Marquer un message comme lu ──
router.patch('/:id/read', protect, idParam, validate, asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw new AppError('Message introuvable', 404);
  
  message.isRead = true;
  await message.save();
  
  res.json({ message: 'Lu', data: message });
}));

export default router;
