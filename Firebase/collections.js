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
exports.getTriedBeers = exports.addTriedBeer = exports.addUser = exports.getUserHelper = exports.getUser = exports.getAllUsers = void 0;
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
// Get user by id
const getUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield (0, exports.getUserHelper)(id);
    if (doc.docs[0].exists()) {
        return doc.docs[0].data();
    }
    else {
        console.log("No such document!");
    }
});
exports.getUser = getUser;
// Get user helper
const getUserHelper = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const usersCollection = (0, firestore_1.collection)(firebase_1.db, "users");
    const q = (0, firestore_1.query)(usersCollection, (0, firestore_1.where)("id", "==", id));
    const doc = yield (0, firestore_1.getDocs)(q);
    return doc;
});
exports.getUserHelper = getUserHelper;
// Add user
const addUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const usersCollection = (0, firestore_1.collection)(firebase_1.db, "users");
    const usersSnapshot = yield (0, firestore_1.getDocs)(usersCollection);
    if (usersSnapshot.docs.find((doc) => doc.id === user.id)) {
        return;
    }
    const newUser = yield (0, firestore_1.addDoc)(usersCollection, user);
    return newUser.id;
});
exports.addUser = addUser;
// Add tried beer
const addTriedBeer = (user, beer) => __awaiter(void 0, void 0, void 0, function* () {
    const querySnap = yield (0, exports.getUserHelper)(user.id);
    const docRef = querySnap.docs[0].ref;
    const triedCollectionRef = (0, firestore_1.collection)(docRef, "tried");
    const newTriedDocRef = yield (0, firestore_1.addDoc)(triedCollectionRef, beer);
    return newTriedDocRef.id;
});
exports.addTriedBeer = addTriedBeer;
// Get tried beers by user
const getTriedBeers = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const querySnap = yield (0, exports.getUserHelper)(user.id);
    const docRef = querySnap.docs[0].ref;
    const triedCollectionRef = (0, firestore_1.collection)(docRef, "tried");
    const triedSnapshot = yield (0, firestore_1.getDocs)(triedCollectionRef);
    const triedList = triedSnapshot.docs.map((doc) => (Object.assign({ id: parseInt(doc.id) }, doc.data())));
    return triedList;
});
exports.getTriedBeers = getTriedBeers;
