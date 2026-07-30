"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { http } from "@/api/httpClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useTheme } from "@/hooks/useTheme";
import { store } from "@/redux/store";

let interceptorsBound = false;

function bindInterceptors() {
  if (interceptorsBound) return;
  interceptorsBound = true;

  http.onError((error) => {
    if (error.status === 401) return; // handled by route guards
    if (error.status === 403) toast.error("Access denied for your role");
    else if (error.code === "offline") toast.warn("Offline — showing last synced telemetry");
    else if (error.status >= 500) toast.error(error.message);
  });
}

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="bottom-right"
      theme={theme === "light" ? "light" : "dark"}
      autoClose={4200}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      toastClassName="aas-toast"
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    bindInterceptors();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
