import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Checkbox,
  Link,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "../ThemeContext";
import Icons from "../icons";
import { LOGIN_API } from "./Constants";
import { AuthUser, saveAuthSession } from "../utils/auth";

interface LoginPageProps {
  onLoginSuccess: (userData: AuthUser) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(LOGIN_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch {
        // response may not be JSON
      }

      if (!response.ok) {
        const errorMsg =
          responseData?.message ||
          responseData?.error ||
          responseData?.title ||
          (typeof responseData === "string" ? responseData : null) ||
          `Login failed with status ${response.status} (${response.statusText})`;
        throw new Error(errorMsg);
      }

      // Successful login - extract tokens & expiry returned by backend
      const accessToken = responseData?.accessToken || responseData?.token;
      const refreshToken = responseData?.refreshToken;
      const accessTokenExpiresAt = responseData?.accessTokenExpiresAt;
      
      const name = responseData?.name || responseData?.userName || responseData?.user?.name || email.split("@")[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);

      const authPayload: AuthUser = {
        email: email.trim(),
        name: displayName,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        ...responseData,
      };

      // Save to localStorage or sessionStorage based on rememberMe
      saveAuthSession(authPayload, rememberMe);

      onLoginSuccess(authPayload);
    } catch (err: any) {
      console.error("Login request error:", err);
      setError(err?.message || "Failed to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden ${
        theme === "dark"
          ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black text-white"
          : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/50 via-zinc-100 to-zinc-200 text-zinc-900"
      }`}
    >
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme Toggle in Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          isIconOnly
          variant="flat"
          radius="full"
          className={
            theme === "dark"
              ? "bg-zinc-800/80 text-amber-400 hover:bg-zinc-700"
              : "bg-white/80 text-zinc-800 shadow-sm hover:bg-zinc-100"
          }
          onPress={toggleTheme}
          aria-label="Toggle Theme"
        >
          <Icon icon={theme === "dark" ? Icons.sunIcon : Icons.moonIcon} width={20} />
        </Button>
      </div>

      {/* Login Card */}
      <Card
        className={`w-full max-w-md backdrop-blur-xl border shadow-2xl transition-all duration-300 ${
          theme === "dark"
            ? "bg-zinc-900/80 border-zinc-800/80 text-white"
            : "bg-white/90 border-zinc-200 text-zinc-900"
        }`}
      >
        <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-4 px-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black shadow-lg shadow-amber-500/20 mb-2">
            <Icon icon={Icons.cubeOutline} width={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Room Configurator</h1>
          <p
            className={`text-sm text-center ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            Sign in to start designing and customizing your 3D space
          </p>
        </CardHeader>

        <CardBody className="px-8 py-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <Icon icon={Icons.xMark20Solid} width={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label
                className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Email Address
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onValueChange={setEmail}
                variant="bordered"
                radius="lg"
                classNames={{
                  inputWrapper:
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-950/50 hover:border-amber-400/60 focus-within:!border-amber-400"
                      : "border-zinc-300 bg-zinc-50 hover:border-amber-500/60 focus-within:!border-amber-500",
                }}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onValueChange={setPassword}
                variant="bordered"
                radius="lg"
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <Icon
                      icon={showPassword ? Icons.eyeSlashSolid : Icons.eyeSolid}
                      width={20}
                    />
                  </button>
                }
                classNames={{
                  inputWrapper:
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-950/50 hover:border-amber-400/60 focus-within:!border-amber-400"
                      : "border-zinc-300 bg-zinc-50 hover:border-amber-500/60 focus-within:!border-amber-500",
                }}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <Checkbox
                isSelected={rememberMe}
                onValueChange={setRememberMe}
                size="sm"
                color="warning"
                classNames={{
                  label: theme === "dark" ? "text-zinc-300" : "text-zinc-700",
                }}
              >
                Remember me
              </Checkbox>
              <Link
                href="#"
                size="sm"
                className="text-amber-500 hover:text-amber-400 text-xs font-medium cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Password reset feature will be connected to authentication service.");
                }}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              color="warning"
              size="lg"
              radius="lg"
              isLoading={isLoading}
              className="w-full font-bold text-black bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-400/20 mt-2 transition-all"
            >
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <Divider className="flex-1" />
            <span
              className={`text-xs uppercase tracking-wider ${
                theme === "dark" ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              Or continue with
            </span>
            <Divider className="flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="flat"
              radius="lg"
              className={
                theme === "dark"
                  ? "bg-zinc-800/80 text-white hover:bg-zinc-700"
                  : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
              }
              onPress={() => {
                const dummy = { email: "demo.user@example.com", name: "Demo User" };
                onLoginSuccess(dummy);
              }}
            >
              Demo Guest
            </Button>
            <Button
              variant="flat"
              radius="lg"
              className={
                theme === "dark"
                  ? "bg-zinc-800/80 text-white hover:bg-zinc-700"
                  : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
              }
              onPress={() => {
                const admin = { email: "admin@configurator.com", name: "Admin" };
                onLoginSuccess(admin);
              }}
            >
              Admin Access
            </Button>
          </div>
        </CardBody>

        <CardFooter className="flex justify-center pb-8 pt-2">
          <p
            className={`text-xs ${
              theme === "dark" ? "text-zinc-500" : "text-zinc-500"
            }`}
          >
            Don't have an account?{" "}
            <Link
              href="#"
              size="sm"
              className="text-amber-500 hover:text-amber-400 text-xs font-semibold cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                alert("Sign up will be connected to user registration.");
              }}
            >
              Create Account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
