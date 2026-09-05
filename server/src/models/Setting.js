import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    dailyTarget: { type: Number, default: 3, min: 1 },
    reminderEmail: { type: String, default: '' },
    remindersEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
