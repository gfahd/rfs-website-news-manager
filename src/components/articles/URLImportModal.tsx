"use client";

import { Link as LinkIcon, Loader2 } from "lucide-react";

interface URLImportModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  onUrlChange: (value: string) => void;
  onImport: () => void;
  importing: boolean;
}

export function URLImportModal({
  open,
  onClose,
  url,
  onUrlChange,
  onImport,
  importing,
}: URLImportModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-200"
      onClick={() => !importing && onClose()}
    >
      <div
        className="bg-slate-900 rounded-xl border border-slate-700 max-w-lg w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-red-400" />
          Import from URL
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          {importing ? (
            <div className="flex items-center gap-3 py-4 text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI is analyzing the URL and creating your article...</span>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onImport}
                disabled={!url.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                Import & Generate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
