import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase }  from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth }      from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBNsFQ6viuZPRBkuawhZg66B9rrqhsIGe0",
  authDomain:        "wfirm-korea.firebaseapp.com",
  databaseURL:       "https://wfirm-korea-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "wfirm-korea",
  storageBucket:     "wfirm-korea.firebasestorage.app",
  messagingSenderId: "968670622632",
  appId:             "1:968670622632:web:bd7a016ef5803e3174e39d"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const auth = getAuth(app);

export { db, auth };
