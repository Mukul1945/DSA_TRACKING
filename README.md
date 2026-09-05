# DSA Practice Tracker

A full-stack tracker for the Love Babbar DSA sheet included in this folder.

The PDF currently contains 448 extracted questions. The app does not hard-code 400, so the dashboard reflects the actual seeded sheet size.

## Stack

- React + Vite frontend
- Node.js + Express backend
- MongoDB with Mongoose
- node-cron reminder check

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   pnpm run install:all
   ```

   On this machine, the bundled fallback package manager is:

   ```bash
   C:\Users\lenvoa\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd install
   C:\Users\lenvoa\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd install --dir server
   C:\Users\lenvoa\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd install --dir client
   ```

2. Create backend environment:

   ```bash
   copy server\.env.example server\.env
   ```

3. Start MongoDB locally, or set `MONGODB_URI` in `server/.env`.

4. Seed questions from the extracted PDF data:

   ```bash
   npm run seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Reminder Emails

Daily reminder checks run at `REMINDER_CRON` and compare today's solved count against your daily target.

If SMTP variables are configured, the backend sends email through Nodemailer. Without SMTP, it logs the reminder to the server console.
