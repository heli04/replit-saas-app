import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  type AuthUser,
} from "@workspace/api-client-react";
import { ApiError } from "@workspace/api-client-react";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  signOutLocal: () => void;
};

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const meKey = getGetCurrentUserQueryKey();

  const { data, isLoading, error, refetch } = useGetCurrentUser({
    query: {
      queryKey: meKey,
      retry: false,
      staleTime: 60_000,
    },
  });

  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const user = isUnauthorized ? null : data ?? null;

  const refresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  const signOutLocal = React.useCallback(() => {
    queryClient.setQueryData(meKey, null);
    queryClient.clear();
  }, [queryClient, meKey]);

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      refresh,
      signOutLocal,
    }),
    [user, isLoading, refresh, signOutLocal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
