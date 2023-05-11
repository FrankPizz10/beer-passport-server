"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// import {
//   addTriedBeer,
//   addUser,
//   getAllUsers,
//   getTriedBeers,
//   getUser,
// } from "./Firebase/collections";
const beerclient_1 = require("./DBclient/beerclient");
const userclient_1 = require("./DBclient/userclient");
const gettableinfo_1 = require("./DBclient/gettableinfo");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
var cors = require("cors");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: false,
}));
app.use(bodyParser.json());
app.use(cors());
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
// Get all users
app.get("/api/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield (0, userclient_1.getAllUsers)();
    res.send(users);
}));
// Add user
app.post("/api/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, userclient_1.addUser)(req.body);
    res.send(user);
}));
// Get all beers
app.get("/api/beers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const beers = yield (0, beerclient_1.getAllBeers)();
    res.send(beers);
}));
// Get beer by category
app.post("/api/beers/cat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const beers = yield (0, beerclient_1.getBeerByCategory)(req.body.cat);
    res.send(beers);
}));
// Get categories
app.get("/api/categories", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield (0, gettableinfo_1.getCategories)();
    res.send(categories);
}));
// Get beer by id
app.get("/api/beers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const beer = yield (0, beerclient_1.getBeerById)(parseInt(req.params.id));
    res.send(beer);
}));
// Add tried beer
app.post("/api/userbeers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const beer = yield (0, userclient_1.updateOrCreateUserBeers)(req.body.user_id, req.body.beer_id, req.body.tried, req.body.liked);
    res.send(beer);
}));
// Get user beers by user
app.get("/api/userbeers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const beers = yield (0, userclient_1.getUserBeersByUserId)(parseInt(req.params.id));
    res.send(beers);
}));
// Get user by uid
app.get("/api/userbyuid/:uid", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, userclient_1.getUser)(req.params.uid);
    if (!user) {
        res.statusCode = 404;
        res.send("User not found");
    }
    res.send(user);
}));
