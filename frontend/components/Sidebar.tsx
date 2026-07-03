"use client";

import { Conversation } from "@/lib/types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  loading,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: "260px",
        minWidth: "260px",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 12px",
          borderBottom: "1px solid var(--sidebar-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.95rem",
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
          }}
        >
          CustomerAI
        </span>
        <button
          onClick={onCreate}
          title="New conversation"
          style={{
            background: "none",
            border: "1px solid var(--sidebar-border)",
            borderRadius: "6px",
            color: "var(--muted)",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: "1rem",
            lineHeight: 1,
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--sidebar-border)";
          }}
        >
          +
        </button>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px" }}>
        {loading ? (
          <div style={{ padding: "16px", color: "var(--muted)", fontSize: "0.85rem" }}>
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: "16px", color: "var(--muted)", fontSize: "0.85rem" }}>
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onSelect={() => onSelect(conv.id)}
              onDelete={() => onDelete(conv.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: "6px",
        margin: "1px 4px",
        background: isActive ? "var(--active)" : "transparent",
        cursor: "pointer",
        position: "relative",
      }}
      onMouseOver={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background = "var(--hover)";
        }
      }}
      onMouseOut={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }
      }}
    >
      <button
        onClick={onSelect}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          color: isActive ? "var(--foreground)" : "var(--muted)",
          cursor: "pointer",
          padding: "9px 10px",
          textAlign: "left",
          fontSize: "0.875rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {conversation.title}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
        style={{
          background: "none",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          padding: "8px 8px 8px 4px",
          fontSize: "0.8rem",
          opacity: 0,
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0";
        }}
        className="delete-btn"
      >
        ✕
      </button>
      <style>{`
        div:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
