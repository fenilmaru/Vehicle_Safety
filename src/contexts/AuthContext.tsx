"use client";

import { createContext, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/api/endpoints";
import { setUser, signOut } from "@/redux/slices/authSlice";
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

/** Store Django JWT in both localStorage and a cookie (for middleware) */
function storeToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("aas_token", token);
  // Set cookie readable by middleware (Next.js server)
  document.cookie = `aas_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("aas_token");
  document.cookie = "aas_token=;path=/;max-age=0";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, status } = useAppSelector((state) => state.auth);

  // On mount, check if we have a token and try to load user
  useEffect(() => {
    if (status === "idle") {
      const token = typeof window !== "undefined" ? localStorage.getItem("aas_token") : null;
      if (token) {
        // Fetch user profile from Django
        void authApi
          .me()
          .then((session) => {
            dispatch(setUser(session.user));
          })
          .catch(() => {
            clearToken();
            dispatch(signOut());
          });
      } else {
        dispatch(signOut());
      }
    }
  }, [dispatch, status]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const result = await authApi.login(identifier, password);
      storeToken(result.token);
      dispatch(setUser(result.user));
      return result.user;
    },
    [dispatch],
  );

  const register = useCallback(
    async (payload: Record<string, unknown>) => {
      const result = await authApi.register(payload);
      storeToken(result.token);
      dispatch(setUser(result.user));
      return result.user;
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    clearToken();
    dispatch(signOut());
    router.push("/login");
  }, [dispatch, router]);

  const refresh = useCallback(() => {
    if (typeof window !== "undefined" && localStorage.getItem("aas_token")) {
      void authApi.me().then((session) => dispatch(setUser(session.user))).catch(() => {});
    }
  }, [dispatch]);

  const hasRole = useCallback(
    (...roles: string[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

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
