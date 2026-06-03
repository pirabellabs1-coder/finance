"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/repositories";
import type { ProfilePatch, RegisterInput, User } from "@/lib/types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<User>;
  changePassword: (current: string, next: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    auth.getCurrentUser().then((current) => {
      if (!active) return;
      setUser(current);
      setStatus(current ? "authenticated" : "unauthenticated");
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const current = await auth.login(email, password);
    setUser(current);
    setStatus("authenticated");
    return current;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const current = await auth.register(input);
    setUser(current);
    setStatus("authenticated");
    return current;
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const requestPasswordReset = useCallback(
    (email: string) => auth.requestPasswordReset(email),
    [],
  );

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user) throw new Error("Non authentifié.");
      const updated = await auth.updateProfile(user.id, patch);
      setUser(updated);
      return updated;
    },
    [user],
  );

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!user) throw new Error("Non authentifié.");
      await auth.changePassword(user.id, current, next);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        logout,
        requestPasswordReset,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
