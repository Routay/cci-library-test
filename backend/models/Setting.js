import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    // Singleton key — toujours 'main'
    key: {
      type:    String,
      default: 'main',
      unique:  true,
    },

    // ── Informations bibliothèque ──
    libraryName: {
      type:    String,
      default: 'Bibliothèque CCI — ESP',
      trim:    true,
    },
    libraryDescription: {
      type:    String,
      default: 'Centre de Culture et d\'Information de l\'École Supérieure Polytechnique de Dakar',
      trim:    true,
    },
    openingHours: {
      type:    String,
      default: 'Lun-Ven : 08h00 — 18h00 | Sam : 09h00 — 13h00',
      trim:    true,
    },
    address: {
      type:    String,
      default: 'ESP, UCAD, Dakar-Fann',
      trim:    true,
    },

    // ── Règles d'emprunt ──
    loanDurationDays: {
      type:    Number,
      default: 14,
      min:     1,
      max:     90,
    },
    maxLoansPerMember: {
      type:    Number,
      default: 3,
      min:     1,
      max:     20,
    },
    penaltyPerDay: {
      type:    Number,
      default: 0,
      min:     0,
    },
    allowRenewals: {
      type:    Boolean,
      default: true,
    },
    maxRenewals: {
      type:    Number,
      default: 1,
      min:     0,
      max:     5,
    },

    // ── Notifications ──
    emailReminders: {
      type:    Boolean,
      default: true,
    },
    reminderDaysBefore: {
      type:    Number,
      default: 2,
      min:     1,
      max:     7,
    },
    emailOnLoanConfirm: {
      type:    Boolean,
      default: true,
    },
    emailOnOverdue: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Méthode statique pour récupérer ou créer le singleton
settingSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'main' });
  if (!settings) {
    settings = await this.create({ key: 'main' });
  }
  return settings;
};

export default mongoose.model('Setting', settingSchema);
