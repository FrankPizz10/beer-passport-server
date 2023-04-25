import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { getAllUsers } from "./Firebase/collections";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

var cors = require("cors");
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
