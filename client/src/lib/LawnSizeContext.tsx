import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export const DEFAULT_LAWN_SIZE = 100;

interface LawnSizeState {
  lawnSize: number;
  setLawnSize: (size: number) => void;
  isSaving: boolean;
  isLoading: boolean;
  saveSuccess: boolean;
}

const LawnSizeContext = createContext<LawnSizeState | null>(null);

/** Holds lawn size for all screens; persists to the user when signed in. */
export function LawnSizeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [lawnSize, setLocalSize] = useState(DEFAULT_LAWN_SIZE);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: async (newSize: number) => {
      setSaveSuccess(false);
      return await apiRequest("PUT", "/api/user/lawn-size", { lawnSize: newSize });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSaveSuccess(true);
      toast({
        title: "Lawn size saved",
        description: "Your lawn size has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      setSaveSuccess(false);
      toast({
        title: "Error saving lawn size",
        description: error.message || "Failed to save lawn size. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user?.lawnSize) setLocalSize(user.lawnSize);
  }, [user?.lawnSize]);

  const setLawnSize = (size: number) => {
    setLocalSize(size);
    if (isAuthenticated) mutation.mutate(size);
  };

  return (
    <LawnSizeContext.Provider
      value={{ lawnSize, setLawnSize, isSaving: mutation.isPending, isLoading, saveSuccess }}
    >
      {children}
    </LawnSizeContext.Provider>
  );
}

export function useLawnSize(): LawnSizeState {
  const ctx = useContext(LawnSizeContext);
  if (!ctx) throw new Error("useLawnSize must be used within LawnSizeProvider");
  return ctx;
}
