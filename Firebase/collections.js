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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = void 0;
const firestore_1 = require("@firebase/firestore");
const firebase_1 = require("./firebase");
// Get all users
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const usersCollection = (0, firestore_1.collection)(firebase_1.db, "users");
    const usersSnapshot = yield (0, firestore_1.getDocs)(usersCollection);
    const usersList = usersSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return usersList;
});
exports.getAllUsers = getAllUsers;
