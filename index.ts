import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {
  addTriedBeer,
  addUser,
  getAllUsers,
  getUser,
} from "./Firebase/collections";
import {
  getAllBeers,
  getBeerByCategory,
  getBeerById,
} from "./DBclient/beerclient";
import { getCategories } from "./DBclient/gettableinfo";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

var cors = require("cors");
const bodyParser = require("body-parser");

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(bodyParser.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// Get all users
app.get("/api/users", async (req: Request, res: Response) => {
  const users = await getAllUsers();
  res.send(users);
});

// Get all beers
app.get("/api/beers", async (req: Request, res: Response) => {
  const beers = await getAllBeers();
  res.send(beers);
});

// Get beer by category
app.post("/api/beers/cat", async (req: Request, res: Response) => {
  const beers = await getBeerByCategory(req.body.cat);
  res.send(beers);
});

// Get categories
app.get("/api/categories", async (req: Request, res: Response) => {
  const categories = await getCategories();
  res.send(categories);
});

// Get beer by id
app.get("/api/beers/:id", async (req: Request, res: Response) => {
  const beer = await getBeerById(parseInt(req.params.id));
  res.send(beer);
});

// Add user
app.post("/api/users", async (req: Request, res: Response) => {
  const user = await addUser(req.body);
  res.send(user);
});

// Get User by id
app.get("/api/users/:id", async (req: Request, res: Response) => {
  const user = await getUser(req.params.id);
  res.send(user);
});

// Add tried beer
app.post("/api/users/tried", async (req: Request, res: Response) => {
  const beer = await addTriedBeer(req.body.user, req.body.beer);
  res.send(beer);
});
