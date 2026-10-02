import express from 'express';
import { Problem } from '../models/Problem.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { topic, difficulty, status, search } = req.query;
    const query = {};

    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const problems = await Problem.find(query).sort({ sheetNumber: 1 });
    res.json(problems);
  } catch (error) {
    next(error);
  }
});

router.get('/meta', async (_req, res, next) => {
  try {
    const [topics, difficulties, statuses] = await Promise.all([
      Problem.distinct('topic'),
      Problem.distinct('difficulty'),
      Problem.distinct('status')
    ]);

    res.json({
      topics: topics.sort(),
      difficulties: difficulties.sort(),
      statuses: statuses.sort()
    });
  } catch (error) {
    next(error);
  }
});

// router.patch('/:id', async (req, res, next) => {
//   try {
//     const allowedStatuses = ['not-started', 'in-progress', 'solved'];
//     const update = {};

//     if (req.body.status) {
//       if (!allowedStatuses.includes(req.body.status)) {
//         return res.status(400).json({ message: 'Invalid status' });
//       }

//       update.status = req.body.status;
//       update.solvedAt = req.body.status === 'solved' ? new Date() : null;
//     }

//     if (req.body.difficulty) {
//       update.difficulty = req.body.difficulty;
//     }

//     const problem = await Problem.findByIdAndUpdate(req.params.id, update, {
//       new: true,
//       runValidators: true
//     });

//     if (!problem) return res.status(404).json({ message: 'Problem not found' });

//     res.json(problem);
//   } catch (error) {
//     next(error);
//   }
// });


router.patch('/:id', async (req, res, next) => {
  try {
    const allowedStatuses = [
      'not-started',
      'in-progress',
      'solved'
    ];

    const update = {};

    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          message: 'Invalid status'
        });
      }

      update.status = req.body.status;
      update.solvedAt =
        req.body.status === 'solved' ? new Date() : null;
    }

    if (req.body.difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(req.body.difficulty)) {
        return res.status(400).json({
          message: 'Invalid difficulty'
        });
      }

      update.difficulty = req.body.difficulty;
    }

    // Update only explicitly supported platform URLs.
    if (req.body.platforms !== undefined) {
      const platforms = req.body.platforms;

      if (
        !platforms ||
        typeof platforms !== 'object' ||
        Array.isArray(platforms)
      ) {
        return res.status(400).json({
          message: 'Invalid platforms object'
        });
      }

      const allowedPlatforms = {
        leetcode: ['leetcode.com'],
        geeksforgeeks: ['geeksforgeeks.org']
      };

      for (const [platform, value] of Object.entries(platforms)) {
        if (!Object.hasOwn(allowedPlatforms, platform)) {
          return res.status(400).json({
            message: `Unsupported platform: ${platform}`
          });
        }

        if (typeof value !== 'string' || value.length > 2048) {
          return res.status(400).json({
            message: `Invalid ${platform} URL`
          });
        }

        if (value.trim() === '') {
          update[`platforms.${platform}`] = '';
          continue;
        }

        let parsedUrl;

        try {
          parsedUrl = new URL(value.trim());
        } catch {
          return res.status(400).json({
            message: `Invalid ${platform} URL`
          });
        }

        const hostname = parsedUrl.hostname.toLowerCase();
        const allowedDomains = allowedPlatforms[platform];

        const isAllowedDomain = allowedDomains.some(
          (domain) =>
            hostname === domain ||
            hostname.endsWith(`.${domain}`)
        );

        if (
          parsedUrl.protocol !== 'https:' ||
          !isAllowedDomain ||
          parsedUrl.username ||
          parsedUrl.password
        ) {
          return res.status(400).json({
            message: `Only valid HTTPS ${platform} URLs are allowed`
          });
        }

        update[`platforms.${platform}`] = parsedUrl.href;
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update'
      });
    }

    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      {
        new: true,
        runValidators: true
      }
    );

    if (!problem) {
      return res.status(404).json({
        message: 'Problem not found'
      });
    }

    res.json(problem);
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message || 'Problem route error' });
});

export default router;
