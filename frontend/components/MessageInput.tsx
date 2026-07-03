"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div
      style={{
        padding: "12px 24px 20px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          background: "var(--input-bg)",
          border: "1px solid var(--input-border)",
          borderRadius: "12px",
          padding: "10px 12px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Send a message... (Enter to send, Shift+Enter for newline)"
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--foreground)",
            fontSize: "0.9rem",
            lineHeight: "1.55",
            resize: "none",
            overflowY: "auto",
            maxHeight: "200px",
            fontFamily: "inherit",
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          style={{
            background: disabled || !value.trim() ? "#333" : "var(--accent)",
            color: disabled || !value.trim() ? "var(--muted)" : "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "6px 14px",
            cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
            fontSize: "0.85rem",
            fontWeight: 500,
            flexShrink: 0,
            transition: "background 0.15s, color 0.15s",
            height: "32px",
          }}
        >
          {disabled ? "..." : "Send"}
        </button>
      </div>
      <p
        style={{
          margin: "6px 0 0 4px",
          fontSize: "0.75rem",
          color: "var(--muted)",
        }}
      >
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
