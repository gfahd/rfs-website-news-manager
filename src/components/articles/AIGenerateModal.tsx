"use client";

import { Sparkles, Loader2 } from "lucide-react";

const TONES = [
  { value: "Professional", label: "Professional" },
  { value: "Friendly", label: "Friendly" },
  { value: "Technical", label: "Technical" },
  { value: "Persuasive", label: "Persuasive" },
];

const LENGTHS = [
  { value: "short", label: "Short (~400 words)" },
  { value: "medium", label: "Medium (~800 words)" },
  { value: "long", label: "Long (~1200 words)" },
];

interface AIGenerateModalProps {
  open: boolean;
  onClose: () => void;
  topic: string;
  onTopicChange: (value: string) => void;
  tone: string;
  onToneChange: (value: string) => void;
  length: "short" | "medium" | "long";
  onLengthChange: (value: "short" | "medium" | "long") => void;
  onGenerate: () => void;
  generating: boolean;
}

export function AIGenerateModal({
  open,
  onClose,
  topic,
  onTopicChange,
  tone,
  onToneChange,
  length,
  onLengthChange,
  onGenerate,
  generating,
}: AIGenerateModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-200"
      onClick={() => !generating && onClose()}
    >
      <div
        className="bg-slate-900 rounded-xl border border-slate-700 max-w-lg w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-400" />
          AI Generate Article
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What should the article be about?
            </label>
            <textarea
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="e.g., Benefits of modern CCTV systems for retail stores"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onToneChange(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    tone === t.value
                      ? "bg-red-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Length</label>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => onLengthChange(l.value as "short" | "medium" | "long")}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    length === l.value
                      ? "bg-red-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {generating ? (
            <div className="flex items-center gap-3 py-4 text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI is writing your article...</span>
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
                onClick={onGenerate}
                disabled={!topic.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                Generate Article
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
