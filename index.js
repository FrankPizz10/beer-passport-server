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
const collections_1 = require("./Firebase/collections");
const beerclient_1 = require("./DBclient/beerclient");
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
    const users = yield (0, collections_1.getAllUsers)();
    res.send(users);
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
// Add user
app.post("/api/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, collections_1.addUser)(req.body);
    res.send(user);
}));
// Get User by id
app.get("/api/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, collections_1.getUser)(req.params.id);
    res.send(user);
}));
// Add tried beer
app.post("/api/users/tried", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const beer = yield (0, collections_1.addTriedBeer)(req.body.user, req.body.beer);
    res.send(beer);
}));
