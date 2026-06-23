import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  date: {
    type: String, // Format 'YYYY-MM-DD'
    required: true,
    index: true,
  },
  count: {
    type: Number,
    default: 1,
  },
}, { timestamps: true });

export default mongoose.model('Visit', visitSchema);
