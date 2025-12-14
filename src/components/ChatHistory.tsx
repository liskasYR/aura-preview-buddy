import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  currentConversationId?: string;
}

export const ChatHistory = ({
  isOpen,
  onClose,
  onSelectConversation,
  currentConversationId,
}: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await (supabase as any)
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setConversations(conversations.filter((c) => c.id !== id));
      toast.success("Conversation deleted");
      
      if (currentConversationId === id) {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="fixed left-0 top-0 h-full w-80 bg-sidebar-background border-r border-sidebar-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Chat History</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading...
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass glow-border rounded-2xl p-4 cursor-pointer hover:bg-sidebar-accent/50 transition-smooth group ${
                      currentConversationId === conversation.id
                        ? "bg-sidebar-accent"
                        : ""
                    }`}
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conversation.title || "New Conversation"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conversation.updated_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => deleteConversation(conversation.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
