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
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
var cors = require("cors");
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
