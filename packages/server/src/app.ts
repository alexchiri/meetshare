import express from 'express';
import path from 'path';
import cors from 'cors';
import { config } from './config.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errors.js';
import healthRouter from './routes/health.js';
import roomsRouter from './routes/rooms.js';
import contentRouter from './routes/content.js';

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.set('trust proxy', 1);
}
app.use(cors({ origin: isProduction ? true : config.clientUrl }));
app.use(express.json());
app.use(generalLimiter);

app.use(healthRouter);
app.use(roomsRouter);
app.use(contentRouter);

// Serve client static files in production
if (isProduction) {
  const clientDist = path.resolve(import.meta.dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

export default app;
