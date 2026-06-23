import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    nom: {
      type:     String,
      required: [true, 'Le nom est obligatoire'],
      trim:     true,
    },
    prenom: {
      type:     String,
      required: [true, 'Le prénom est obligatoire'],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, "L'email est obligatoire"],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    tel: {
      type:    String,
      default: '',
    },
    password: {
      type:   String,
      select: false, // jamais renvoyé par défaut
    },
    role: {
      type:    String,
      enum:    ['membre', 'admin', 'super_admin'],
      default: 'membre',
    },
    actif: {
      type:    Boolean,
      default: true,
    },
    etablissement: {
      type:    String,
      enum:    ['', 'Université', 'École de formation', 'Institut', 'Autre'],
      default: '',
    },
    sexe: {
      type:    String,
      enum:    ['', 'M', 'F'],
      default: '',
    },
    departement: {
      type:    String,
      default: '',
      trim:    true,
    },
    logeCampus: {
      type:    Boolean,
      default: false,
    },
    chambre: {
      type:    String,
      default: '',
      trim:    true,
    },
    lastLogin: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash du mot de passe avant chaque sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Méthode pour comparer le mot de passe
userSchema.methods.comparePassword = async function (candidatePwd) {
  return bcrypt.compare(candidatePwd, this.password);
};

// Virtuel : nom complet
userSchema.virtual('fullName').get(function () {
  return `${this.prenom} ${this.nom}`;
});

export default mongoose.model('User', userSchema);