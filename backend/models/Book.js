import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Le titre est obligatoire'],
      trim:     true,
    },
    author: {
      type:     String,
      required: [true, "L'auteur est obligatoire"],
      trim:     true,
    },
    category: {
      type:    String,
      enum:    ['Aqida', 'Tawhid', 'Fiqh', 'Sira', 'Hadith', 'Tazkiyya', 'Autre'],
      default: 'Autre',
    },
    stock: {
      type:    Number,
      default: 1,
      min:     [0, 'Le stock ne peut pas être négatif'],
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    cover: {
      type:    String,
      default: '',
    },
    isWeekly: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index pour la recherche full-text
bookSchema.index({ title: 'text', author: 'text' });

export default mongoose.model('Book', bookSchema);