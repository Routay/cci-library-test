import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      required: [true, 'Le nom du donateur est obligatoire'],
      trim: true,
    },
    donorEmail: {
      type: String,
      required: [true, "L'email du donateur est obligatoire"],
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Veuillez fournir un email valide',
      ],
    },
    donorPhone: {
      type: String,
      trim: true,
      default: '',
    },
    bookTitle: {
      type: String,
      required: [true, 'Le titre du livre est obligatoire'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "L'auteur du livre est obligatoire"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    pdfUrl: {
      type: String,
      required: [true, 'Le fichier PDF est obligatoire'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Donation', donationSchema);
