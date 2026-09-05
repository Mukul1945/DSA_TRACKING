import express from 'express';
import { Problem } from '../models/Problem.js';
import { getSettings } from '../services/settingsService.js';

const router = express.Router();

function startOfLocalDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function getStreak(dates) {
  const solvedDays = new Set(
    dates
      .filter(Boolean)
      .map((date) => startOfLocalDay(date).toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = startOfLocalDay(new Date());

  while (solvedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

router.get('/', async (_req, res, next) => {
  try {
    const [total, solved, topicBreakdown, difficultyBreakdown, solvedProblems, settings] =
      await Promise.all([
        Problem.countDocuments(),
        Problem.countDocuments({ status: 'solved' }),
        Problem.aggregate([
          { $group: { _id: '$topic', total: { $sum: 1 }, solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } } } },
          { $sort: { _id: 1 } }
        ]),
        Problem.aggregate([
          { $group: { _id: '$difficulty', total: { $sum: 1 }, solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } } } },
          { $sort: { _id: 1 } }
        ]),
        Problem.find({ status: 'solved' }).select('solvedAt').lean(),
        getSettings()
      ]);

    const today = startOfLocalDay(new Date());
    const todaySolved = solvedProblems.filter((problem) => problem.solvedAt >= today).length;

    res.json({
      total,
      solved,
      remaining: Math.max(total - solved, 0),
      completionPercent: total ? Math.round((solved / total) * 100) : 0,
      streak: getStreak(solvedProblems.map((problem) => problem.solvedAt)),
      todaySolved,
      dailyTarget: settings.dailyTarget,
      topicBreakdown: topicBreakdown.map((item) => ({
        topic: item._id,
        total: item.total,
        solved: item.solved
      })),
      difficultyBreakdown: difficultyBreakdown.map((item) => ({
        difficulty: item._id,
        total: item.total,
        solved: item.solved
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message || 'Dashboard route error' });
});

export default router;
