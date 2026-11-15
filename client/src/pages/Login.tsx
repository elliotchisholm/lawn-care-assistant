import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
        return;
      }
      if (response.status === 429) {
        setError("Too many failed attempts. Try again in 15 minutes.");
      } else if (response.status === 401) {
        setError("Incorrect password.");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col justify-center bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Leaf className="h-9 w-9 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-login-title">NZLA Lawn Care Assistant</h1>
          <p className="text-sm text-muted-foreground">Enter the app password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 pr-12 text-base"
                data-testid="input-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="!absolute right-0 top-0 h-12 w-12"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert" data-testid="text-login-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="min-h-12 w-full text-base"
            disabled={submitting || password.length === 0}
            data-testid="button-submit-login"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
          <a
            href="/"
            className="block min-h-11 py-3 text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            data-testid="link-continue-signed-out"
          >
            Continue without signing in
          </a>
        </form>
      </div>
    </main>
  );
}
