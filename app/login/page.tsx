"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-md-surface text-md-on-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header with Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-md-primary-container rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-md-on-primary-container" />
          </div>
          <h1 className="text-headline-medium md:text-3xl font-bold text-center">
            Admin Access
          </h1>
          <p className="text-md-on-surface-variant mt-2 text-center">
            Sign in to manage events
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-md-surface-container p-8 rounded-[32px] space-y-6 shadow-sm"
        >
          {error && (
            <div className="bg-md-error/10 text-md-error px-4 py-3 rounded-xl text-sm font-medium flex items-center">
              {error}
            </div>
          )}

          {/* MD3 Filled Input - Username */}
          <div className="relative group">
            <div className="bg-md-surface-container-highest rounded-t-lg border-b border-md-outline/40 h-14 relative flex items-center px-4 transition-colors focus-within:border-b-2 focus-within:border-md-primary hover:bg-md-on-surface/5">
              <input
                id="username"
                type="text"
                required
                className="w-full bg-transparent border-none outline-none text-md-on-surface placeholder-transparent peer pt-4 pb-1 text-base h-full"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label
                htmlFor="username"
                className="absolute left-4 top-4 text-md-on-surface-variant text-base transition-all duration-200 pointer-events-none 
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
                peer-focus:top-1 peer-focus:text-xs peer-focus:text-md-primary
                peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs"
              >
                Username
              </label>
            </div>
          </div>

          {/* MD3 Filled Input - Password */}
          <div className="relative group">
            <div className="bg-md-surface-container-highest rounded-t-lg border-b border-md-outline/40 h-14 relative flex items-center px-4 transition-colors focus-within:border-b-2 focus-within:border-md-primary hover:bg-md-on-surface/5">
              <input
                id="password"
                type="password"
                required
                className="w-full bg-transparent border-none outline-none text-md-on-surface placeholder-transparent peer pt-4 pb-1 text-base h-full"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-4 text-md-on-surface-variant text-base transition-all duration-200 pointer-events-none 
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base 
                peer-focus:top-1 peer-focus:text-xs peer-focus:text-md-primary
                peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs"
              >
                Password
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-md-primary text-md-on-primary font-medium text-sm tracking-wide shadow-sm hover:shadow-md hover:bg-md-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
