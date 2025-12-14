import { MessageSquare, Trash2, Edit2, Check, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ConversationHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string) => void;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const ConversationHistory = ({
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title || "New Chat");
  };

  const handleSaveEdit = async (convId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: editingTitle })
        .eq('id', convId);

      if (error) throw error;

      setEditingId(null);
      loadConversations();
      if (onRenameConversation) onRenameConversation(convId);
      toast.success("Title updated");
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat History Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground">Chat History</h2>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
        {isLoading ? (
          <div className="text-center text-xs text-muted-foreground py-4">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-4">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              {editingId === conv.id ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(conv.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleSaveEdit(conv.id)}
                  >
                    <Check className="h-3 w-3 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onSelectConversation(conv.id);
                      loadConversations();
                    }}
                    className={`w-full text-left justify-start gap-2 px-2 py-1.5 h-auto hover:bg-sidebar-accent/50 transition-all ${
                      currentConversationId === conv.id ? "bg-sidebar-accent text-primary" : ""
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate text-muted-foreground hover:text-foreground">{conv.title || "New Chat"}</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </Button>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar-background/80 pl-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(conv);
                      }}
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                        loadConversations();
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
        </div>
      </ScrollArea>
    </div>
  );
};
