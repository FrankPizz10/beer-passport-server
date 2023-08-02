// // Import the functions you need from the SDKs you need
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import dotenv from 'dotenv';

// dotenv.config();

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: process.env.API_KEY,
//   authDomain: process.env.AUTH_DOMAIN,
//   projectId: process.env.PROJECT_ID,
//   storageBucket: process.env.STORAGE_BUCKET,
//   messagingSenderId: process.env.MESSAGE_SENDER_ID,
//   appId: process.env.APP_ID,
//   measurementId: process.env.MEASUREMENT_ID,
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initalize Firebase Auth
// export const auth = getAuth(app);

// // Initalize Firebase Firestore
// export const db = getFirestore(app);

export const admin = require("firebase-admin");

const serviceAccount = require("C:/Users/fpizz/OneDrive/Documents/BeerPassport/Secrets/beerpassport-b31d8-firebase-adminsdk-6avyz-4f32856e2e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
