import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    member: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le membre est obligatoire'],
    },
    book: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Book',
      required: [true, 'Le livre est obligatoire'],
    },
    borrowDate: {
      type:    Date,
      default: Date.now,
    },
    dueDate: {
      type:     Date,
      required: [true, 'La date de retour est obligatoire'],
    },
    returnDate: {
      type:    Date,
      default: null,
    },
    status: {
      type:    String,
      enum:    ['en_attente', 'actif', 'retard', 'rendu'],
      default: 'en_attente',
    },
    notes: {
      type:    String,
      default: '',
    },
  },
  { timestamps: true }
);

// Passe automatiquement en "retard" si la date est dépassée
loanSchema.pre('save', function (next) {
  if (this.status !== 'rendu' && this.dueDate < new Date()) {
    this.status = 'retard';
  }
  next();
});

export default mongoose.model('Loan', loanSchema);