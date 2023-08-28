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

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT;

app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);

app.use(bodyParser.json());
app.use(cors());

if (process.env.NODE_ENV === 'production') {
  app.use(decodeUserToken);
}

app.use(adminRoutes);
app.use(userRoutes);
app.use(beerRoutes);
app.use(userbeerRoutes);
app.use(userbadgeRoutes);
app.use(collectionRoutes);
app.use(collectionbeerRoutes);
app.use(friendRoutes);

export const prismaCtx = createContext();

app.get('/', (req: Request, res: Response) => {
  return res.send('Express + TypeScript Server');
});

export const server = app.listen(PORT, () => {
  console.log(`⚡️[server]: Beer Passport Server is running at http://localhost:${PORT}`);
});
