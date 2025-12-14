interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  sources?: Array<{ title: string; link: string; snippet: string }>;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = "deta_conversations";

export const conversationStorage = {
  getAll(): Conversation[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const conversations = JSON.parse(data);
    return conversations.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  },

  getById(id: string): Conversation | null {
    const conversations = this.getAll();
    return conversations.find((c) => c.id === id) || null;
  },

  create(messages: Message[] = []): Conversation {
    const conversations = this.getAll();
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: this.generateTitle(messages),
      messages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    conversations.unshift(newConversation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    return newConversation;
  },

  update(id: string, messages: Message[]): void {
    const conversations = this.getAll();
    const index = conversations.findIndex((c) => c.id === id);
    if (index !== -1) {
      conversations[index].messages = messages;
      conversations[index].updatedAt = new Date();
      conversations[index].title = this.generateTitle(messages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  },

  delete(id: string): void {
    const conversations = this.getAll();
    const filtered = conversations.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  deleteAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  generateTitle(messages: Message[]): string {
    if (messages.length === 0) return "New Chat";
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (!firstUserMessage) return "New Chat";
    const content = firstUserMessage.content;
    return content.length > 30 ? content.substring(0, 30) + "..." : content;
  },
};
