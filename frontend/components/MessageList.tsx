"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
}

export default function MessageList({
  messages,
  loading,
  streaming,
  streamingContent,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages / streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: "0.9rem",
        }}
      >
        Loading messages...
      </div>
    );
  }

  if (messages.length === 0 && !streaming) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: "0.95rem",
        }}
      >
        Send a message to start the conversation
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Streaming AI bubble */}
      {streaming && (
        <StreamingBubble content={streamingContent} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "var(--user-bubble)" : "var(--ai-bubble)",
          color: "var(--foreground)",
          fontSize: "0.9rem",
          lineHeight: "1.55",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          border: isUser ? "none" : "1px solid var(--sidebar-border)",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderRadius: "18px 18px 18px 4px",
          background: "var(--ai-bubble)",
          color: "var(--foreground)",
          fontSize: "0.9rem",
          lineHeight: "1.55",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          border: "1px solid var(--sidebar-border)",
        }}
      >
        {content || <BlinkingCursor />}
        {content && <BlinkingCursor />}
      </div>
    </div>
  );
}

function BlinkingCursor() {
  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 0.85s step-end infinite;
        }
      `}</style>
      <span className="cursor" />
    </>
  );
}
