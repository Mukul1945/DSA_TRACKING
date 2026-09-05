import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { Problem } from '../models/Problem.js';

const seedProblems = JSON.parse(
  fs.readFileSync(new URL('../data/problems.seed.json', import.meta.url), 'utf-8')
);

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dsa-practice-tracker';
  await mongoose.connect(mongoUri);

  const operations = seedProblems.map((problem) => ({
    updateOne: {
      filter: { sheetNumber: problem.sheetNumber },
      update: { $setOnInsert: problem },
      upsert: true
    }
  }));

  if (operations.length) {
    await Problem.bulkWrite(operations);
  }

  const total = await Problem.countDocuments();
  console.log(`Seed complete. Problems in database: ${total}`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
