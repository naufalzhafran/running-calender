"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.message || "Login failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-md-background text-md-on-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Backdrops */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-md-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-md-secondary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 -z-10" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-md-surface-container-low rounded-xl p-8 border border-md-outline/5 relative overflow-hidden">
          {/* Decorative shape inside card */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-md-primary/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-md-primary-container rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-md-on-primary-container" />
              </div>
              <h1 className="text-3xl font-bold text-md-on-surface text-center tracking-tight">
                Admin Access
              </h1>
              <p className="text-md-on-surface-variant mt-2 text-center text-sm">
                Sign in to manage events
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm font-medium flex items-center justify-center border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="Email admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-md-surface-container-highest/50 border-md-outline/10 focus-visible:ring-md-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-md-surface-container-highest/50 border-md-outline/10 focus-visible:ring-md-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full font-medium text-sm tracking-wide shadow-sm"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
