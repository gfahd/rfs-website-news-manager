"use client";

import { useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Link as LinkIcon,
  List,
  Quote,
  Code,
  Sparkles,
  Wand2,
  Loader2,
} from "lucide-react";

export interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAIImprove: () => void;
  onAIFormat: () => void;
  isGenerating?: boolean;
  generatingAction?: string;
}

const FORMAT_BUTTONS: { icon: React.ReactNode; label: string; wrap: [string, string]; block?: boolean }[] = [
  { icon: <Bold className="w-4 h-4" />, label: "Bold", wrap: ["**", "**"] },
  { icon: <Italic className="w-4 h-4" />, label: "Italic", wrap: ["*", "*"] },
  { icon: <Heading2 className="w-4 h-4" />, label: "Heading", wrap: ["## ", ""], block: true },
  { icon: <LinkIcon className="w-4 h-4" />, label: "Link", wrap: ["[", "](url)"] },
  { icon: <List className="w-4 h-4" />, label: "List", wrap: ["- ", ""], block: true },
  { icon: <Quote className="w-4 h-4" />, label: "Quote", wrap: ["> ", ""], block: true },
  { icon: <Code className="w-4 h-4" />, label: "Code", wrap: ["`", "`"] },
];

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  block?: boolean
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.slice(start, end);

  let newText: string;
  let newCursor: number;

  if (block) {
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", end);
    const lineEndPos = lineEnd === -1 ? text.length : lineEnd;
    const line = text.slice(lineStart, lineEndPos);
    newText = text.slice(0, lineStart) + before + line + after + text.slice(lineEndPos);
    newCursor = lineStart + before.length + line.length + after.length;
  } else {
    newText = text.slice(0, start) + before + selected + after + text.slice(end);
    newCursor = start + before.length + selected.length + after.length;
  }

  return { newText, newCursor };
}

export function ContentEditor({
  value,
  onChange,
  onAIImprove,
  onAIFormat,
  isGenerating,
  generatingAction,
}: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = value.length;

  const insertFormat = useCallback(
    (before: string, after: string, block?: boolean) => {
      const el = textareaRef.current;
      if (!el) return;
      const { newText, newCursor } = insertAtCursor(el, before, after, block);
      onChange(newText);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newCursor, newCursor);
      });
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Article Content</span>
        <span className="text-slate-500 text-sm font-mono">
          {wordCount} words · {charCount} chars
        </span>
      </div>

      {/* Mini formatting toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 overflow-x-auto pb-1">
        {FORMAT_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => insertFormat(btn.wrap[0], btn.wrap[1], btn.block)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all duration-200"
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
        <span className="w-px h-5 bg-slate-600 mx-1" aria-hidden />
        <button
          type="button"
          onClick={onAIImprove}
          disabled={!value.trim() || isGenerating}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 text-sm transition-all duration-200 disabled:opacity-50"
        >
          {isGenerating && generatingAction === "improve" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          AI Improve
        </button>
        <button
          type="button"
          onClick={onAIFormat}
          disabled={!value.trim() || isGenerating}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 text-sm transition-all duration-200 disabled:opacity-50"
        >
          {isGenerating && generatingAction === "format" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          AI Format
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your article in markdown..."
        required
        className="w-full min-h-[400px] px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-400 font-mono text-sm resize-y transition-all duration-200"
      />
    </div>
  );
}
