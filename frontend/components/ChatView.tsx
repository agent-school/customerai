"use client";

import { useEffect, useRef, useState } from "react";
import { Message, Conversation } from "@/lib/types";
import { api } from "@/lib/api";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";

interface ChatViewProps {
  conversation: Conversation;
  onTitleChange: (title: string) => void;
}

export default function ChatView({ conversation, onTitleChange }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const prevIdRef = useRef<string | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (prevIdRef.current === conversation.id) return;
    prevIdRef.current = conversation.id;

    setLoading(true);
    setMessages([]);
    setStreamingContent("");
    setError(null);

    api
      .getMessages(conversation.id)
      .then((msgs) => {
        setMessages(msgs);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load messages.");
        setLoading(false);
      });
  }, [conversation.id]);

  const handleSend = async (content: string) => {
    if (streaming) return;

    const optimisticUser: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUser]);
    setStreaming(true);
    setStreamingContent("");
    setError(null);

    // Auto-title the conversation from the first user message
    if (messages.length === 0) {
      const title = content.slice(0, 40) + (content.length > 40 ? "…" : "");
      onTitleChange(title);
    }

    await api.sendMessage(
      conversation.id,
      content,
      (token) => {
        setStreamingContent((prev) => prev + token);
      },
      (fullMessage) => {
        // Replace optimistic user message with confirmed one and add AI message
        setMessages((prev) => {
          const withoutOptimistic = prev.filter(
            (m) => !m.id.startsWith("temp-")
          );
          return [...withoutOptimistic, fullMessage];
        });
        setStreamingContent("");
        setStreaming(false);
      },
      (err) => {
        setError(err);
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
        setStreamingContent("");
        setStreaming(false);
      }
    );
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--chat-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid var(--sidebar-border)",
          fontSize: "0.95rem",
          fontWeight: 500,
          color: "var(--foreground)",
          flexShrink: 0,
        }}
      >
        {conversation.title}
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        streaming={streaming}
        streamingContent={streamingContent}
      />

      {/* Error */}
      {error && (
        <div
          style={{
            margin: "0 24px 8px",
            padding: "10px 14px",
            background: "#2d1a1a",
            border: "1px solid #7f1d1d",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "0.85rem",
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
