import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore,setDoc, addDoc, collection, query, where, onSnapshot, orderBy, serverTimestamp, getDocs, doc, getDoc } from "firebase/firestore"; // Ensure getDoc is imported
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDwbuUjZGCf-gVOK_wc5ivNpbSbBtEfgwc",
    authDomain: "teammanagements.firebaseapp.com",
    projectId: "teammanagements",
    storageBucket: "teammanagements.appspot.com",
    messagingSenderId: "358343501162",
    appId: "1:358343501162:web:ee70d6976ad472e030b113",
    measurementId: "G-YVN443TXM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();
const storage = getStorage(app);

export {
    app,
    auth,
    createUserWithEmailAndPassword,
    db,
    onSnapshot,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    where,
    signOut,
    collection,
    storage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    getDocs,
    doc,
    getDoc,
    setDoc // Ensure getDoc is exported
};
