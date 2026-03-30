import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

/** 인증 상태 감시 **/
export function initAuthState(onLogin, onLogout) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      onLogin(user);
    } else {
      onLogout();
    }
  });
}

/** 이메일 로그인 **/
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** 로그아웃 **/
export async function logout() {
  return signOut(auth);
}

/** 현재 사용자 **/
export function getCurrentUser() {
  return auth.currentUser;
}
