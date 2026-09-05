import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    sheetNumber: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    topic: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'solved'],
      default: 'not-started',
      index: true
    },
    solvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

problemSchema.index({ name: 'text', topic: 'text' });

export const Problem = mongoose.model('Problem', problemSchema);
