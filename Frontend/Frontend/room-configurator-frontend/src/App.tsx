import { useState, useEffect } from "react";
import { HeroUIProvider, ToastProvider, addToast } from "@heroui/react";
import ViewPanel from "./components/ViewPanel";
import LoginPage from "./components/LoginPage";
import { ThemeProvider } from "./ThemeContext";
import { AuthUser, getStoredAuthSession, clearAuthSession, isAccessTokenExpired } from "./utils/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const session = getStoredAuthSession();
    if (session && session.accessTokenExpiresAt && isAccessTokenExpired(session.accessTokenExpiresAt)) {
      clearAuthSession();
      return null;
    }
    return session;
  });

  const handleLoginSuccess = (userData: AuthUser) => {
    setUser(userData);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
  };

  // Check token expiry periodically if user is logged in
  useEffect(() => {
    if (!user?.accessTokenExpiresAt) return;

    const interval = setInterval(() => {
      if (isAccessTokenExpired(user.accessTokenExpiresAt)) {
        addToast({
          title: "Session Expired",
          description: "Your session has expired. Please sign in again.",
          color: "warning",
          timeout: 4000,
        });
        handleLogout();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <HeroUIProvider>
      <ThemeProvider>
        <ToastProvider
          toastProps={{
            classNames: {
              base: "light bg-white text-zinc-900 border border-zinc-200 shadow-xl",
              title: "text-zinc-900 font-bold",
              description: "text-zinc-650",
            },
          }}
        />
        {!user ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <ViewPanel onLogout={handleLogout} />
        )}
      </ThemeProvider>
    </HeroUIProvider>
  );
}


