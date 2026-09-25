import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isAdminSender: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      required: [true, 'Le contenu du message est obligatoire'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedDonationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
