import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import api from "../api/client";

const AuthContext = createContext(null);

function readableError(error, fallback) {
  const code = error?.code;
  const messages = {
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password":
      "Choose a stronger password with at least 6 characters.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/user-not-found": "No account was found with this email.",
    "auth/wrong-password": "The email or password is incorrect.",
    "auth/popup-closed-by-user":
      "The Google sign-in window was closed before completion.",
  };
  return (
    messages[code] ||
    error?.response?.data?.detail ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(
    () => localStorage.getItem("ql_active_role") || "customer",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent concurrent/duplicate sync calls for the same Firebase login
  const syncInFlightRef = useRef(null);
  const registeringRef = useRef(false);

  const syncFirebaseUser = async (firebaseUser, extra = {}) => {
    if (syncInFlightRef.current) {
      return syncInFlightRef.current;
    }

    const task = (async () => {
      const idToken = await firebaseUser.getIdToken(true);
      const { data } = await api.post("/api/v1/auth/firebase/", {
        id_token: idToken,
      });
      const profile = data.user || data.profile || data;
      const merged = {
        ...profile,
        email: profile.email || firebaseUser.email,
        full_name:
          profile.full_name ||
          extra.full_name ||
          firebaseUser.displayName ||
          "",
        photo_url:
          profile.photo_url ||
          profile.avatar_url ||
          firebaseUser.photoURL ||
          "",
        firebase_uid: firebaseUser.uid,
        role: profile.role || "customer",
      };

      const savedRole = localStorage.getItem("ql_active_role") || "customer";
      localStorage.setItem("ql_user", JSON.stringify(merged));
      localStorage.setItem("ql_active_role", savedRole);
      setUser(merged);
      setActiveRole(savedRole);
      setError(null);
      return merged;
    })();

    syncInFlightRef.current = task;
    try {
      return await task;
    } finally {
      syncInFlightRef.current = null;
    }
  };

  useEffect(() => {
    if (!auth) {
      const saved = localStorage.getItem("ql_user");
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          localStorage.removeItem("ql_user");
        }
      }
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Let registerWithEmail finish setting displayName before syncing
      if (registeringRef.current) {
        return;
      }

      try {
        await syncFirebaseUser(firebaseUser);
      } catch (syncError) {
        console.error("QueueLess profile sync failed:", syncError);
        // Only fall back to cached profile if the user was already synced earlier
        const cached = localStorage.getItem("ql_user");
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    setError(null);
    if (!auth) {
      throw new Error(
        "Firebase is not configured. Add your Firebase settings to the frontend .env file.",
      );
    }
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      return await syncFirebaseUser(credential.user);
    } catch (err) {
      const message = readableError(
        err,
        "Unable to sign in. Please try again.",
      );
      setError(message);
      throw new Error(message);
    }
  };

  const registerWithEmail = async (payload) => {
    setError(null);
    if (!auth) {
      throw new Error(
        "Firebase is not configured. Add your Firebase settings to the frontend .env file.",
      );
    }

    registeringRef.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        payload.email.trim(),
        payload.password,
      );
      const fullName = [payload.first_name, payload.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (fullName) {
        await updateFirebaseProfile(credential.user, { displayName: fullName });
      }
      return await syncFirebaseUser(credential.user, { full_name: fullName });
    } catch (err) {
      const message = readableError(
        err,
        "Registration failed. Please check your details.",
      );
      setError(message);
      throw new Error(message);
    } finally {
      registeringRef.current = false;
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    if (!auth) {
      throw new Error(
        "Firebase is not configured. Add your Firebase settings to the frontend .env file.",
      );
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await syncFirebaseUser(result.user);
    } catch (err) {
      const message = readableError(err, "Google sign-in failed.");
      setError(message);
      throw new Error(message);
    }
  };

  const switchRole = (role) => {
    setActiveRole(role);
    localStorage.setItem("ql_active_role", role);
  };

  const logout = async () => {
    try {
      if (auth) await firebaseSignOut(auth);
    } finally {
      ["ql_access", "ql_refresh", "ql_user", "ql_active_role"].forEach((key) =>
        localStorage.removeItem(key),
      );
      setUser(null);
      setActiveRole("customer");
    }
  };

  const updateProfile = (partial) => {
    const next = { ...user, ...partial };
    localStorage.setItem("ql_user", JSON.stringify(next));
    setUser(next);
  };

  const value = {
    user,
    activeRole,
    primaryRole: user?.role || "customer",
    switchRole,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
