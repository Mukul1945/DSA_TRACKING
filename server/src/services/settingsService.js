import { Setting } from '../models/Setting.js';

const SETTINGS_KEY = 'default';

export async function getSettings() {
  return Setting.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { new: true, upsert: true }
  ).lean();
}

export async function updateSettings(values) {
  const update = {};

  if (values.dailyTarget !== undefined) update.dailyTarget = Math.max(Number(values.dailyTarget), 1);
  if (values.reminderEmail !== undefined) update.reminderEmail = values.reminderEmail.trim();
  if (values.remindersEnabled !== undefined) update.remindersEnabled = Boolean(values.remindersEnabled);

  return Setting.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: update, $setOnInsert: { key: SETTINGS_KEY } },
    { new: true, upsert: true, runValidators: true }
  ).lean();
}
