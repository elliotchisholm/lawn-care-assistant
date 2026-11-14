import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter the app password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                data-testid="input-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert" data-testid="text-login-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || password.length === 0}
              data-testid="button-submit-login"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
