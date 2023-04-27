import {
  collection,
  getDocs,
  where,
  query,
  doc,
  addDoc,
} from "@firebase/firestore";
import { db } from "./firebase";
import { getDoc } from "firebase/firestore";

export interface User {
  id: string;
  username: string;
  age: number;
  email: string;
  tried: Beer[];
  liked: Beer[];
}

export interface Beer {
  id: number;
}

// Get all users
export const getAllUsers = async () => {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  const usersList = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
  return usersList;
};

// Get user by id
export const getUser = async (id: string) => {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("id", "==", id));
  const doc = await getDocs(q);
  if (doc.docs[0].exists()) {
    return doc.docs[0].data() as User;
  } else {
    console.log("No such document!");
  }
};

// Add user
export const addUser = async (user: User) => {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  if (usersSnapshot.docs.find((doc) => doc.id === user.id)) {
    return;
  }
  const newUser = await addDoc(usersCollection, user);
  return newUser.id;
};

// Add tried beer
export const addTriedBeer = async (user: User, beer: Beer) => {
  const usersCollection = collection(db, "users");
  const userDoc = doc(usersCollection, user.id);
  const triedBeer = await addDoc(collection(userDoc, "tried"), beer);
  return triedBeer.id;
};
