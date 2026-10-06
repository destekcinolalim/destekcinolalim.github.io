// Firebase SDK'sı tek noktadan içe aktarılır.
// Sürüm yükseltmek için yalnızca bu dosyadaki URL'leri değiştirin.
export { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
export {
  getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
export {
  getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc,
  deleteDoc, increment, serverTimestamp, setDoc, getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
