import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'RETURN', 'LOGIN'],
    },
    entity: {
      type: String,
      required: true,
      enum: ['Book', 'Loan', 'User', 'Session'],
    },
    details: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ActivityLog', activityLogSchema);
