"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";

interface ErrorState {
  message: string;
  details?: string;
}

interface ErrorContextValue {
  showError: (message: string, details?: string) => void;
  dismissError: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = useCallback((message: string, details?: string) => {
    setError({ message, details });
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, dismissError }}>
      {children}
      {error && (
        <ErrorToast
          message={error.message}
          details={error.details}
          onDismiss={dismissError}
        />
      )}
    </ErrorContext.Provider>
  );
}

export function useError(): ErrorContextValue {
  const ctx = useContext(ErrorContext);
  if (!ctx) {
    throw new Error("useError must be used within ErrorProvider");
  }
  return ctx;
}
