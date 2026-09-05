import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { Problem } from '../models/Problem.js';
import { getSettings } from './settingsService.js';

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendReminder(settings, todaySolved) {
  const remaining = Math.max(settings.dailyTarget - todaySolved, 0);
  const subject = `DSA target reminder: ${remaining} problem${remaining === 1 ? '' : 's'} left today`;
  const text = `You solved ${todaySolved}/${settings.dailyTarget} problems today. Open your DSA tracker and finish the remaining ${remaining}.`;
  const transporter = createTransporter();

  if (!transporter || !settings.reminderEmail) {
    console.log(`[Reminder] ${subject}. ${text}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.REMINDER_FROM || 'DSA Tracker <no-reply@dsatracker.local>',
    to: settings.reminderEmail,
    subject,
    text
  });
}

export function startReminderJob() {
  const schedule = process.env.REMINDER_CRON || '0 20 * * *';
  const timezone = process.env.TIMEZONE || 'Asia/Kolkata';

  cron.schedule(
    schedule,
    async () => {
      try {
        const settings = await getSettings();
        if (!settings.remindersEnabled) return;

        const todaySolved = await Problem.countDocuments({
          status: 'solved',
          solvedAt: { $gte: startOfToday() }
        });

        if (todaySolved < settings.dailyTarget) {
          await sendReminder(settings, todaySolved);
        }
      } catch (error) {
        console.error('Reminder job failed', error);
      }
    },
    { timezone }
  );

  console.log(`Reminder job scheduled: ${schedule} (${timezone})`);
}
