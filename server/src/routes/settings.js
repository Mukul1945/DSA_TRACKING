import express from 'express';
import { getSettings, updateSettings } from '../services/settingsService.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getSettings());
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const { dailyTarget, reminderEmail, remindersEnabled } = req.body;
    const settings = await updateSettings({ dailyTarget, reminderEmail, remindersEnabled });
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message || 'Settings route error' });
});

export default router;
