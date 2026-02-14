import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, DoctorSignupPayload } from "../api/auth";
import { loginRequest, signupDoctor as signupDoctorApi } from "../api/auth";
import { setAuthToken } from "../api/client";

const AUTH_TOKEN_KEY = "homeolytics_auth_token";
const AUTH_USER_KEY = "homeolytics_auth_user";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  initializing: boolean;
  hasAcceptedDisclaimer: boolean;
  login: (email: string, password: string) => Promise<void>;
  signupDoctor: (payload: DoctorSignupPayload) => Promise<void>;
  acceptDisclaimer: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  // Restore auth from storage on mount (so refresh keeps user logged in)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedToken, storedUserJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (cancelled || !storedToken || !storedUserJson) {
          setInitializing(false);
          return;
        }
        const parsedUser = JSON.parse(storedUserJson) as User;
        setToken(storedToken);
        setUser(parsedUser);
        setAuthToken(storedToken);
        await loadDisclaimerState(parsedUser.id);
      } catch {
        // Invalid or missing stored auth
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadDisclaimerState = async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`homeolytics_disclaimer_${userId}`);
      setHasAcceptedDisclaimer(stored === "true");
    } catch {
      setHasAcceptedDisclaimer(false);
    }
  };

  const persistAuth = async (newUser: User, newToken: string) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser)),
    ]);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      setUser(data.user);
      setToken(data.token);
      setAuthToken(data.token);
      await persistAuth(data.user, data.token);
      await loadDisclaimerState(data.user.id);
    } finally {
      setLoading(false);
    }
  };

  const signupDoctor = async (payload: DoctorSignupPayload) => {
    setLoading(true);
    try {
      const data = await signupDoctorApi(payload);
      setUser(data.user);
      setToken(data.token);
      setAuthToken(data.token);
      await persistAuth(data.user, data.token);
      setHasAcceptedDisclaimer(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    setHasAcceptedDisclaimer(false);
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    } catch {
      // ignore
    }
  };

  const acceptDisclaimer = () => {
    if (user) {
      AsyncStorage.setItem(`homeolytics_disclaimer_${user.id}`, "true").catch(() => undefined);
    }
    setHasAcceptedDisclaimer(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initializing,
        hasAcceptedDisclaimer,
        login,
        signupDoctor,
        acceptDisclaimer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

