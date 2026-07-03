import { Conversation, Message } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${BASE_URL}/conversations`);
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  async createConversation(title: string): Promise<Conversation> {
    const res = await fetch(`${BASE_URL}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/conversations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(
      `${BASE_URL}/conversations/${conversationId}/messages`
    );
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  /**
   * Send a message and return a ReadableStream of the AI response tokens.
   * The server sends SSE: `data: <token>\n\n` and `data: [DONE]\n\n`
   */
  async sendMessage(
    conversationId: string,
    content: string,
    onToken: (token: string) => void,
    onDone: (fullMessage: Message) => void,
    onError: (err: string) => void
  ): Promise<void> {
    let res: Response;
    try {
      res = await fetch(
        `${BASE_URL}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
    } catch (e) {
      onError("Could not connect to the server. Is the backend running?");
      return;
    }

    if (!res.ok) {
      const text = await res.text();
      onError(`Server error: ${res.status} ${text}`);
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.token !== undefined) {
            onToken(parsed.token);
          } else if (parsed.message) {
            onDone(parsed.message);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  },
};
