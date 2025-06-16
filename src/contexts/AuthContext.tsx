import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  // add other user fields as needed
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string,
  ) => Promise<{ error: Error | null; data: any | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; data: any | null }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (
    provider: string
  ) => Promise<{ error: Error | null; data: any | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Optionally, load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, username }),
      });
      console.log("Sign up response:", res);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sign up failed");
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      return { error: null, data };
    } catch (error: any) {
      return { error, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sign in failed");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      return { error: null, data };
    } catch (error: any) {
      return { error, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setUser(null);
    localStorage.removeItem("user");
    setIsLoading(false);
  };

  const signInWithOAuth = async (provider: string) => {
    throw new Error("OAuth sign-in is not implemented yet.");
  };

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
