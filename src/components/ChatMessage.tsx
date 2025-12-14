import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./MarkdownContent";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  isTyping?: boolean;
  sources?: Array<{ title: string; link: string; snippet: string }>;
}

interface ChatMessageProps {
  message: Message;
  index?: number;
}

export const ChatMessage = ({ message, index = 0 }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(isUser);

  useEffect(() => {
    if (isUser) {
      setDisplayedContent(message.content);
      setIsTypingComplete(true);
      return;
    }

    // Typing animation for assistant
    let currentIndex = 0;
    setDisplayedContent("");
    setIsTypingComplete(false);

    const typingInterval = setInterval(() => {
      if (currentIndex < message.content.length) {
        setDisplayedContent(message.content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typingInterval);
      }
    }, 3);

    return () => clearInterval(typingInterval);
  }, [message.content, isUser]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "flex gap-2 md:gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Avatar className={cn(
          "h-8 w-8 md:h-10 md:w-10 shrink-0 border-2",
          isUser 
            ? "bg-card border-muted" 
            : "gradient-primary border-primary shadow-neon"
        )}>
          <AvatarFallback>
            {isUser ? (
              <User className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            )}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: isUser ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn(
          "max-w-[85%] md:max-w-[80%] rounded-2xl px-3 py-3 md:px-5 md:py-4 transition-smooth",
          isUser
            ? "bg-card/60 border border-muted/50 glow-border"
            : "bg-card/40 border border-primary/30 glow-border shadow-glow"
        )}
      >
        <div className={cn("text-sm prose prose-invert max-w-none", isUser ? "text-right" : "text-left")}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <MarkdownContent content={displayedContent} />
              {!isTypingComplete && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block ml-1 text-primary"
                >
                  ▊
                </motion.span>
              )}
            </>
          )}
        </div>
        
        {message.images && message.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 md:mt-4 space-y-2 md:space-y-3"
          >
            {message.images.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: idx * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                className="relative group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-glow/20 to-primary/20 rounded-lg md:rounded-xl blur-lg md:blur-xl"
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.img
                  src={img}
                  alt={`Generated ${idx + 1}`}
                  initial={{ opacity: 0, filter: "blur(20px) brightness(0.5)" }}
                  animate={{ opacity: 1, filter: "blur(0px) brightness(1)" }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.8, delay: idx * 0.2 + 0.3 }}
                  className="relative rounded-lg md:rounded-xl max-w-full border border-primary/40 md:border-2 shadow-neon"
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 + 0.8 }}
                  className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-center text-primary/70 font-medium"
                >
                  ✨ Created by Deta AI
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {message.sources && message.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4 pt-4 border-t border-primary/20"
          >
            <p className="text-xs font-semibold text-primary mb-2">📚 Sources:</p>
            <div className="space-y-2">
              {message.sources.map((source, idx) => (
                <motion.a
                  key={idx}
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="block p-2 rounded-lg bg-card/40 border border-primary/20 hover:border-primary/40 transition-smooth hover:bg-card/60"
                >
                  <p className="text-xs font-medium text-primary truncate">{source.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.snippet}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
        
        <p className="mt-3 text-xs text-muted-foreground/70">
          {message.timestamp.toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </motion.div>
    </motion.div>
  );
};
