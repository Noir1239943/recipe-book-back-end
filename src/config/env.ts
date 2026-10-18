import dotenv from 'dotenv';
dotenv.config();

// FRONTEND_URL can hold several origins separated by commas,
// e.g. "https://recipe-book.vercel.app,http://localhost:5173".
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const ENV = {
  APP_NAME: process.env.APP_NAME || 'Recipe Book API',
  PORT: parseInt(process.env.PORT || '7000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_change_me',
  FRONTEND_URL: frontendUrls[0],
  FRONTEND_URLS: frontendUrls,
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:7000',
  DATABASE_URL: process.env.DATABASE_URL,
  CSRF_SECRET: process.env.CSRF_SECRET,
  // Day boundaries for the admin dashboard chart.
  APP_TIMEZONE: process.env.APP_TIMEZONE || 'Asia/Manila',
  // Used only by `npm run db:seed` to create the first admin account.
  ADMIN_NAME: process.env.ADMIN_NAME || 'Administrator',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  // Optional demo USER account with sample recipes, also created by `npm run db:seed`.
  DEMO_USER_NAME: process.env.DEMO_USER_NAME || 'Demo User',
  DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD,
};

if (ENV.NODE_ENV === 'production' && ENV.JWT_SECRET === 'fallback_secret_change_me') {
  throw new Error('JWT_SECRET must be set in production');
}
