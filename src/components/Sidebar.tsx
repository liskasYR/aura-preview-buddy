import {
  MessageSquarePlus,
  Settings,
  Library,
  Bot,
  LogOut,
  User,
  Compass,
  Shield,
  Palette,
  Plus,
} from "lucide-react";
import detaLogo from "@/assets/deta-logo.png";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ConversationHistory } from "./ConversationHistory";
import { useNavigate } from "react-router-dom";
import { memo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  onNewChat: () => void;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isAuthenticated: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onLibraryOpen: () => void;
}

export const Sidebar = memo(({
  onNewChat,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isAuthenticated,
  isOpen,
  onToggle,
  onLibraryOpen,
}: SidebarProps) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
      return;
    }

    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };

    checkAdminRole();
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-2 select-all cursor-pointer">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="flex items-center justify-center"
          >
            <img src={detaLogo} alt="Deta Logo" className="h-8 w-8" draggable="true" />
          </motion.div>

          <h1 className="text-2xl font-bold text-foreground select-text">
            Deta
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="px-2 space-y-2 pb-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              onClick={onNewChat}
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              title="New Chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
              <span>New Chat</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              onClick={onLibraryOpen}
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              title="Library"
            >
              <Library className="h-5 w-5" />
              <span>Library</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              onClick={() => navigate("/discover")}
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              title="Discover"
            >
              <Compass className="h-5 w-5" />
              <span>Discover</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all relative"
              title="AI Agent"
            >
              <Bot className="h-5 w-5" />
              <span>AI Agent</span>
              <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex-1 overflow-hidden"
        >
          <ConversationHistory
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            onDeleteConversation={onDeleteConversation}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-2 space-y-2 flex-shrink-0">
        {isAuthenticated && (
          <>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={() => navigate("/settings")}
                className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={() => navigate("/profile")}
                className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={() => navigate("/personality")}
                className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              >
                <Palette className="h-5 w-5" />
                <span>Personality</span>
              </Button>
            </motion.div>
          </>
        )}

        {isAdmin && (
          <>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              >
                <Shield className="h-5 w-5" />
                <span>Admin Panel</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={() => navigate("/discover")}
                className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>New Post</span>
              </Button>
            </motion.div>
          </>
        )}

        {isAuthenticated ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-destructive transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex justify-center"
          >
            <Button
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Sign In / Sign Up
            </Button>
          </motion.div>
        )}

        <div className="px-2 text-xs text-center text-muted-foreground">
          Powered by LiskCell · LPT Engine
        </div>
      </div>
    </aside>
  );
});