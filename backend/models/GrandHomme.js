import mongoose from 'mongoose';

const grandHommeSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Le nom est obligatoire'],
      trim:     true,
    },
    title: {
      type:     String,
      required: [true, 'Le titre / surnom est obligatoire'],
      trim:     true,
    },
    dates: {
      type:     String,
      trim:     true,
      default:  '',
    },
    description: {
      type:     String,
      required: [true, 'La description est obligatoire'],
      trim:     true,
    },
    image: {
      type:     String,
      default:  '',
    },
    tags: {
      type:     [String],
      default:  [],
    },
    ordre: {
      type:     Number,
      default:  0,
    },
    actif: {
      type:     Boolean,
      default:  true,
    },
  },
  { timestamps: true }
);

grandHommeSchema.index({ name: 'text', title: 'text' });

export default mongoose.model('GrandHomme', grandHommeSchema);
