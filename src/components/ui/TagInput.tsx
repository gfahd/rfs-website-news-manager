"use client";

import { useState } from "react";
import { X } from "lucide-react";

export interface TagInputProps {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  /** For `htmlFor` on an external label */
  inputId?: string;
  id?: string;
  "aria-label"?: string;
}

export function TagInput({ values, onChange, placeholder, inputId, id, "aria-label": ariaLabel }: TagInputProps) {
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/^[,]+|[,]+$/g, "");
    if (!tag || values.includes(tag)) return;
    onChange([...values, tag]);
    setInput("");
  };

  const remove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div
      className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 min-h-[42px]"
      id={id}
    >
      {values.map((v, i) => (
        <span
          key={`${v}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1 text-sm text-white"
        >
          {v}
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-full p-0.5 hover:bg-slate-600 text-slate-400 hover:text-white"
            aria-label={`Remove ${v}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <input
        id={inputId}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          }
        }}
        onBlur={() => input.trim() && add(input)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="flex-1 min-w-[120px] bg-transparent text-white placeholder:text-slate-500 border-none outline-none text-sm py-1 focus-visible:ring-0"
      />
    </div>
  );
}
