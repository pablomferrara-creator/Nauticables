import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./config";

export interface FirebaseSessionState {
  authUser: User | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseSession() {
  const [session, setSession] = useState<FirebaseSessionState>({
    authUser: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, (authUser) => {
      setSession({
        authUser,
        loading: false,
        error: null,
      });
    });
  }, []);

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSession((current) => ({
        ...current,
        error: null,
      }));
    } catch (error) {
      setSession((current) => ({
        ...current,
        error:
          error instanceof Error
            ? "No pude iniciar sesion. Revisemos email y contrasena."
            : "No pude iniciar sesion.",
      }));
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return {
    ...session,
    login,
    logout,
  };
}
