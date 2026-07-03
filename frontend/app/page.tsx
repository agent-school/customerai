"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import { Conversation } from "@/lib/types";
import { api } from "@/lib/api";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all conversations on mount
  useEffect(() => {
    api.getConversations().then((data) => {
      setConversations(data);
      if (data.length > 0) setActiveId(data[0].id);
      setLoading(false);
    });
  }, []);

  const createConversation = async () => {
    const conv = await api.createConversation("New conversation");
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  };

  const deleteConversation = async (id: string) => {
    await api.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createConversation}
        onDelete={deleteConversation}
        loading={loading}
      />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeConversation ? (
          <ChatView
            conversation={activeConversation}
            onTitleChange={(title) => updateConversationTitle(activeConversation.id, title)}
          />
        ) : (
          <EmptyState onCreate={createConversation} loading={loading} />
        )}
      </main>
    </div>
  );
}

function EmptyState({
  onCreate,
  loading,
}: {
  onCreate: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--muted)",
        gap: "16px",
      }}
    >
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p style={{ fontSize: "1.1rem" }}>No conversation selected</p>
          <button
            onClick={onCreate}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Start a new conversation
          </button>
        </>
      )}
    </div>
  );
}
