import { collection, getDocs, where } from "@firebase/firestore";
import { db } from "./firebase";

export interface User {
  id: string;
  name: string;
  age: number;
  email: string;
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
