import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
// import {
//   addTriedBeer,
//   addUser,
//   getAllUsers,
//   getTriedBeers,
//   getUser,
// } from "./Firebase/collections";
import {
  getAllBeers,
  getBeerByCategory,
  getBeerById,
} from "./DBclient/beerclient";
import {
  getAllUsers,
  addUser,
  getUser,
  updateOrCreateUserBeers,
  getUserBeersByUserId,
} from "./DBclient/userclient";
import { getCategories } from "./DBclient/gettableinfo";
import { get } from "http";

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

// Add user
app.post("/api/users", async (req: Request, res: Response) => {
  const user = await addUser(req.body);
  res.send(user);
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

// Get User by id
app.get("/api/users/:id", async (req: Request, res: Response) => {
  const user = await getUser(req.params.id);
  if (user) {
    res.send(user);
  } else {
    res.statusCode = 404;
    res.send("User not found");
  }
});

// Add tried beer
app.post("/api/userbeers", async (req: Request, res: Response) => {
  const user_id = await getUser(req.body.user_uid);
  if (!user_id) {
    res.statusCode = 404;
    res.send("User not found");
  }
  const beer = await updateOrCreateUserBeers(
    user_id!.id,
    req.body.beer_id,
    req.body.tried,
    req.body.liked
  );
  res.send(beer);
});

// Get user beers by user
app.get("/api/userbeers/:id", async (req: Request, res: Response) => {
  const user_id = await getUser(req.params.id);
  if (!user_id) {
    res.statusCode = 404;
    res.send("User not found");
  }
  const beers = await getUserBeersByUserId(user_id!.id);
  res.send(beers);
});
