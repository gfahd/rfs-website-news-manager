"use client";

import { X, Sparkles } from "lucide-react";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  onAISuggest?: () => void;
  aiSuggestDisabled?: boolean;
  "data-testid"?: string;
}

export function TagInput({
  label,
  value,
  onChange,
  inputValue,
  onInputChange,
  placeholder = "Add tag, comma separated",
  onAISuggest,
  aiSuggestDisabled,
}: TagInputProps) {
  const addFromInput = () => {
    const trimmed = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (trimmed.length) {
      onChange([...new Set([...value, ...trimmed])]);
      onInputChange("");
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm placeholder:text-slate-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addFromInput();
            }
          }}
          onBlur={addFromInput}
        />
        {onAISuggest != null && (
          <button
            type="button"
            onClick={onAISuggest}
            disabled={aiSuggestDisabled}
            className="px-2.5 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50"
            title={`AI Suggest ${label.toLowerCase()}`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-md text-sm text-slate-200"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
