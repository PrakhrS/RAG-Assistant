// Side-effect import — must be first so env vars are available
// when db/ and redis/ modules initialize at import time.
import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { checkConnection } from './db/index.js';
import './redis/client.js';
import errorHandler from './middlewares/error.middleware.js';
import router from './routes/index.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

app.use('/api', router);

// Mount error handler last, after all routes
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await checkConnection();
  } catch {
    // Already logged inside checkConnection — don't crash the server
  }
});