import { createContext, useContext, useState, useEffect } from "react";
import {
  signUp,
  signIn,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  authErrorMessage,
} from "../services/authService.js";
import { isFirebaseConfigured } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until Firebase tells us the initial auth state
  const [error, setError] = useState("");

  // Firebase restores the persisted session and then calls this listener.
  useEffect(() => {
    const unsubscribe = subscribeToAuth(
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (err) => {
        setError(authErrorMessage(err));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Runs an auth action, stores the error message in context. Returns true on success.
  async function run(action) {
    setError("");
    try {
      await action();
      return true;
    } catch (err) {
      setError(authErrorMessage(err));
      return false;
    }
  }

  const value = {
    user,
    loading,
    error,
    configured: isFirebaseConfigured,
    clearError: () => setError(""),
    signup: (email, password) => run(() => signUp(email, password)),
    login: (email, password) => run(() => signIn(email, password)),
    loginWithGoogle: () => run(() => signInWithGoogle()),
    logout: () => run(() => signOutUser()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
