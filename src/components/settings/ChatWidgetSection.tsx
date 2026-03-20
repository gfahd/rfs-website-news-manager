"use client";

import { ExternalLink, MessageSquare } from "lucide-react";
import type { Ref } from "react";
import type { ChatWidgetConfig } from "@/types/chat-widget";
import { FormField, inputClassName, SubCard, textareaClassName } from "./form-primitives";

function ChatToggle({
  checked,
  disabled,
  onClick,
}: {
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onClick}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 ${
          checked ? "bg-[#059669]" : "bg-[#6B7280]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-xs font-medium text-slate-400 tabular-nums min-w-[1.75rem]" aria-hidden>
        {checked ? "On" : "Off"}
      </span>
    </div>
  );
}

export function ChatWidgetSection({
  chatWidget,
  setChatWidget,
  chatWidgetLoading,
  chatWidgetSavingKey,
  chatWidgetSavingSection,
  chatWidgetLastSaved,
  saveChatWidgetToggle,
  saveChatWidgetSection,
  sectionHeadingRef,
}: {
  chatWidget: ChatWidgetConfig;
  setChatWidget: React.Dispatch<React.SetStateAction<ChatWidgetConfig>>;
  chatWidgetLoading: boolean;
  chatWidgetSavingKey: string | null;
  chatWidgetSavingSection: string | null;
  chatWidgetLastSaved: Record<string, string>;
  saveChatWidgetToggle: (key: keyof ChatWidgetConfig, value: boolean) => void;
  saveChatWidgetSection: (section: "master" | "urls", keys: (keyof ChatWidgetConfig)[]) => void;
  sectionHeadingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div
      id="settings-panel-chat"
      role="tabpanel"
      aria-labelledby="settings-panel-chat-heading"
      className="rounded-xl overflow-hidden border border-slate-700"
    >
      <div className="bg-[#1B4F8C] px-6 py-4 flex flex-wrap items-center gap-2">
        <h2
          ref={sectionHeadingRef}
          tabIndex={-1}
          id="settings-panel-chat-heading"
          className="text-lg font-semibold text-white flex flex-wrap items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
        >
          <MessageSquare className="w-5 h-5 shrink-0" aria-hidden />
          Chat Widget Settings
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#059669] text-white">
            Live Website
          </span>
          {chatWidgetLoading ? (
            <span className="w-2 h-2 rounded-full bg-slate-400" title="Loading…" />
          ) : chatWidget.enable_chat ? (
            <span className="flex items-center gap-1.5 text-sm font-normal text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Widget Live" />
              Widget Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-normal text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-500" title="Widget Offline" />
              Widget Offline
            </span>
          )}
        </h2>
      </div>
      <p className="bg-slate-800/80 text-slate-400 text-sm px-6 py-2 border-b border-slate-700">
        Controls the live chat bubble on redflagsecurity.ca — separate from CMS settings
      </p>
      <div className="border-b border-slate-600" />

      {chatWidgetLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-[#1B4F8C]" />
        </div>
      ) : (
        <div className="bg-slate-900 p-6 space-y-6">
          <SubCard title="Master controls">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-slate-300 block">Enable Chat Widget</span>
                  <p className="text-xs text-slate-500 italic mt-0.5">Master switch — turns off entire chat bubble on website</p>
                </div>
                <div className="flex items-center gap-2">
                  <ChatToggle
                    checked={chatWidget.enable_chat}
                    disabled={chatWidgetSavingKey === "enable_chat"}
                    onClick={() => saveChatWidgetToggle("enable_chat", !chatWidget.enable_chat)}
                  />
                  {chatWidgetSavingKey === "enable_chat" && (
                    <span className="w-4 h-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                  )}
                </div>
              </div>
              <FormField
                label="Widget Header Title"
                description="Title shown in the chat bubble header"
                htmlFor="chat-header-title"
              >
                <input
                  id="chat-header-title"
                  type="text"
                  value={chatWidget.header_title}
                  onChange={(e) => setChatWidget((c) => ({ ...c, header_title: e.target.value }))}
                  className={inputClassName}
                />
              </FormField>
              <FormField
                label="Welcome Message"
                description="First message shown when chat opens"
                htmlFor="chat-welcome"
              >
                <textarea
                  id="chat-welcome"
                  value={chatWidget.welcome_message}
                  onChange={(e) => setChatWidget((c) => ({ ...c, welcome_message: e.target.value }))}
                  rows={3}
                  className={textareaClassName}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Business Hours"
                  description="Displayed in the widget header bar (e.g. Mon-Fri 9AM-5PM)"
                  htmlFor="chat-hours"
                >
                  <input
                    id="chat-hours"
                    type="text"
                    value={chatWidget.business_hours}
                    onChange={(e) => setChatWidget((c) => ({ ...c, business_hours: e.target.value }))}
                    className={inputClassName}
                  />
                </FormField>
                <FormField
                  label="Support Phone"
                  description="Phone number shown in the widget header bar"
                  htmlFor="chat-phone"
                >
                  <input
                    id="chat-phone"
                    type="text"
                    value={chatWidget.support_phone}
                    onChange={(e) => setChatWidget((c) => ({ ...c, support_phone: e.target.value }))}
                    className={inputClassName}
                  />
                </FormField>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 pt-2 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => saveChatWidgetSection("master", ["header_title", "welcome_message", "business_hours", "support_phone"])}
                disabled={chatWidgetSavingSection === "master"}
                className="px-4 py-2 rounded-lg bg-[#1B4F8C] hover:bg-[#2563eb] disabled:opacity-50 text-white font-medium text-sm"
              >
                {chatWidgetSavingSection === "master" ? "Saving…" : "Save Changes"}
              </button>
              {chatWidgetLastSaved.header_title && (
                <span className="text-xs text-slate-500">Last updated: {new Date(chatWidgetLastSaved.header_title).toLocaleString()}</span>
              )}
            </div>
          </SubCard>

          <SubCard title="Department switches">
            <div className="space-y-4">
              {[
                { key: "enable_sales" as const, label: "Sales Chat", desc: "Show Sales department option in the chat selector" },
                { key: "enable_support" as const, label: "Support Chat", desc: "Show Support department option in the chat selector" },
                { key: "enable_estimates" as const, label: "Free Estimate Chat", desc: "Show Estimate department option in the chat selector" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <span className="text-sm font-medium text-slate-300 block">{label}</span>
                    <p className="text-xs text-slate-500 italic mt-0.5">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {chatWidgetSavingKey === key && (
                      <span className="w-4 h-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                    )}
                    <ChatToggle
                      checked={chatWidget[key]}
                      disabled={chatWidgetSavingKey === key}
                      onClick={() => saveChatWidgetToggle(key, !chatWidget[key])}
                    />
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(chatWidgetLastSaved).some((k) => ["enable_sales", "enable_support", "enable_estimates"].includes(k)) && (
              <p className="text-xs text-slate-500 mt-2">Toggles save automatically.</p>
            )}
          </SubCard>

          <SubCard title="Chatbot URLs">
            <div className="mb-4 px-4 py-3 rounded-lg border border-[#D97706] bg-[#FEF3C7] text-[#92400E] text-sm">
              ⚠️ Changing these URLs affects the live website immediately
            </div>
            <div className="space-y-4">
              {[
                { key: "url_sales" as const, label: "Sales Chatbot URL", desc: "URL loaded in iframe when customer selects Sales" },
                { key: "url_support" as const, label: "Support Chatbot URL", desc: "URL loaded in iframe when customer selects Support" },
                { key: "url_estimate" as const, label: "Estimate Chatbot URL", desc: "URL loaded in iframe when customer selects Free Estimate" },
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <FormField label={label} description={desc} htmlFor={`chat-url-${key}`}>
                    <div className="flex gap-2">
                      <input
                        id={`chat-url-${key}`}
                        type="url"
                        value={chatWidget[key]}
                        onChange={(e) => setChatWidget((c) => ({ ...c, [key]: e.target.value }))}
                        className={`font-mono ${inputClassName} flex-1`}
                      />
                      {chatWidget[key]?.trim() ? (
                        <a
                          href={chatWidget[key].trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                          title="Open in new tab"
                          aria-label="Open URL in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span
                          className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-500 opacity-50 cursor-not-allowed"
                          title="Enter a URL to open"
                          aria-hidden
                        >
                          <ExternalLink className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </FormField>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 pt-2 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => saveChatWidgetSection("urls", ["url_sales", "url_support", "url_estimate"])}
                disabled={chatWidgetSavingSection === "urls"}
                className="px-4 py-2 rounded-lg bg-[#1B4F8C] hover:bg-[#2563eb] disabled:opacity-50 text-white font-medium text-sm"
              >
                {chatWidgetSavingSection === "urls" ? "Saving…" : "Save Changes"}
              </button>
              {chatWidgetLastSaved.url_sales && (
                <span className="text-xs text-slate-500">Last updated: {new Date(chatWidgetLastSaved.url_sales).toLocaleString()}</span>
              )}
            </div>
          </SubCard>
        </div>
      )}
    </div>
  );
}
