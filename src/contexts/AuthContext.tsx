"use client";

import { createContext, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/api/endpoints";
import { fetchSession, setUser, signOut } from "@/redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import type { UserProfile } from "@/utils/types";

type AuthValue = {
  user: UserProfile | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<UserProfile>;
  register: (payload: Record<string, unknown>) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refresh: () => void;
  hasRole: (...roles: string[]) => boolean;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, status } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchSession());
  }, [dispatch, status]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const result = await authApi.login(identifier, password);
      dispatch(setUser(result.user));
      return result.user;
    },
    [dispatch],
  );

  const register = useCallback(
    async (payload: Record<string, unknown>) => {
      const result = await authApi.register(payload);
      dispatch(setUser(result.user));
      return result.user;
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    dispatch(signOut());
    router.push("/login");
  }, [dispatch, router]);

  const refresh = useCallback(() => {
    void dispatch(fetchSession());
  }, [dispatch]);

  const hasRole = useCallback((...roles: string[]) => (user ? roles.includes(user.role) : false), [user]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && Boolean(user),
      login,
      register,
      logout,
      refresh,
      hasRole,
    }),
    [user, status, login, register, logout, refresh, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
