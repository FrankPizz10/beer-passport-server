import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createContext } from '../context';
import { decodeUserToken } from './Middleware/authUsers';
import adminRoutes from './Routes/admins';
import userRoutes from './Routes/users';
import beerRoutes from './Routes/beers';
import userbeerRoutes from './Routes/userbeers';
import userbadgeRoutes from './Routes/userbadges';
import collectionbeerRoutes from './Routes/collectionbeers';
import collectionRoutes from './Routes/collections';
import friendRoutes from './Routes/friends';
import notificationsRoutes from './Routes/notifications';
import { seedDatabase } from './DBclient/seedDatabase';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT;

Sentry.init({
  dsn: 'https://ccf26de0744f7d798d87f9c0fa57c8a0@o4506191549104128.ingest.sentry.io/4506191553167360',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);

app.use(Sentry.Handlers.errorHandler());

app.use(bodyParser.json());
app.use(cors());

app.use('/api', decodeUserToken);
app.use(adminRoutes);
app.use(userRoutes);
app.use(beerRoutes);
app.use(userbeerRoutes);
app.use(userbadgeRoutes);
app.use(collectionRoutes);
app.use(collectionbeerRoutes);
app.use(friendRoutes);
app.use(notificationsRoutes);

export const prismaCtx = createContext();

seedDatabase();

app.get('/', (req: Request, res: Response) => {
  return res.send('BeerPassport Server Running! Stay Thirsty!');
});

export const server = app.listen(PORT, () => {
  console.log(`⚡️[server]: Beer Passport Server is running at http://localhost:${PORT}`);
});
