"use client";

import { useState, useCallback } from "react";
import { X, Copy, ChevronDown, ChevronRight } from "lucide-react";

export interface ErrorToastProps {
  message: string;
  details?: string;
  onDismiss: () => void;
}

export function ErrorToast({ message, details, onDismiss }: ErrorToastProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyFull = useCallback(() => {
    const text = details ? `${message}\n\n${details}` : message;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message, details]);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-lg bg-red-900/90 border border-red-700 text-red-100 rounded-xl p-4 shadow-lg"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium select-text break-words" style={{ userSelect: "text" }}>
            {message}
          </p>
          {details && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="text-xs text-red-200 hover:text-red-100 inline-flex items-center gap-1"
              >
                {showDetails ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                {showDetails ? "Hide Details" : "Show Details"}
              </button>
              {showDetails && (
                <pre
                  className="mt-1.5 p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs font-mono text-red-200 overflow-auto max-h-40"
                  style={{ userSelect: "text" }}
                >
                  <code>{details}</code>
                </pre>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={copyFull}
            className="p-1.5 rounded-lg text-red-200 hover:bg-red-800/80 hover:text-red-100 transition-colors"
            title="Copy error"
          >
            {copied ? (
              <span className="text-xs text-emerald-300">Copied</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-red-200 hover:bg-red-800/80 hover:text-red-100 transition-colors"
            title="Dismiss"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
