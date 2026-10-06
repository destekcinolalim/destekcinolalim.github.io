import { initializeApp, getAuth, getFirestore, GoogleAuthProvider } from './sdk.js';
import { firebaseConfig } from './config.js';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const gp = new GoogleAuthProvider();
