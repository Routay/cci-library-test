import express from 'express';
import Message from '../models/Message.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── POST /api/messages ── Envoyer un message ─────────
router.post('/', protect, async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/messages/my-conversation ── Récupérer la conversation d'un bénévole ──
router.get('/my-conversation', protect, async (req, res) => {
  try {
    // Tous les messages où je suis l'expéditeur ou le destinataire
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
    })
    .populate('senderId', 'nom prenom role')
    .populate('receiverId', 'nom prenom role')
    .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/messages/admin/conversations ── Récupérer toutes les conversations (Admin) ──
router.get('/admin/conversations', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('senderId', 'nom prenom email partnerStatus')
      .populate('receiverId', 'nom prenom email')
      .populate('relatedDonationId', 'bookTitle status')
      .sort({ createdAt: -1 });
    
    // On pourrait grouper par utilisateur côté frontend ou ici.
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/messages/:id/read ── Marquer un message comme lu ──
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message introuvable' });
    
    message.isRead = true;
    await message.save();
    
    res.json({ message: 'Lu', data: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
