import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';

// Fail fast if required configuration is missing, rather than crashing on the
// first request that needs it.
const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
