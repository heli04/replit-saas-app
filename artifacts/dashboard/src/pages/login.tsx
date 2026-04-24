import * as React from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";

export function LoginPage() {
  const [, navigate] = useLocation();
  const { refresh, isAuthenticated } = useAuth();
  const [email, setEmail] = React.useState("admin@pulse.app");
  const [password, setPassword] = React.useState("demo1234");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async () => {
        await refresh();
        navigate("/", { replace: true });
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 401) {
          setErrorMsg("Invalid email or password");
        } else {
          setErrorMsg("Something went wrong. Please try again.");
        }
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 font-semibold text-xl tracking-tight mb-8 justify-center">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-background" />
          </div>
          Pulse
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your analytics dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loginMutation.isPending}
              />
            </div>

            {errorMsg && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Demo account:</span>{" "}
            admin@pulse.app / demo1234
          </div>
        </div>
      </div>
    </div>
  );
}
