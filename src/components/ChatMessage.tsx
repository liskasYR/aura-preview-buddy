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
  timestamp: Date | string;
  images?: string[];
  generatedImages?: string[];
  isTyping?: boolean;
  sources?: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
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
    if (isUser || message.isTyping === false) {
      setDisplayedContent(message.content);
      setIsTypingComplete(true);
      return;
    }

    let currentIndex = 0;
    setDisplayedContent("");
    setIsTypingComplete(false);

    const typingInterval = setInterval(() => {
      if (currentIndex < message.content.length) {
        const charsToAdd = Math.min(4, message.content.length - currentIndex);
        currentIndex += charsToAdd;
        setDisplayedContent(message.content.slice(0, currentIndex));
      } else {
        setIsTypingComplete(true);
        clearInterval(typingInterval);
      }
    }, 10);

    return () => clearInterval(typingInterval);
  }, [message.id, message.content, message.isTyping, isUser]);

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
      {/* Avatar */}
      <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
        <Avatar
          className={cn(
            "h-8 w-8 md:h-10 md:w-10 shrink-0 border-2",
            isUser
              ? "bg-card border-muted"
              : "gradient-primary border-primary shadow-neon"
          )}
        >
          <AvatarFallback>
            {isUser ? (
              <User className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            )}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Message bubble */}
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
        {/* Text */}
        <div
          className={cn(
            "text-sm prose prose-invert max-w-none",
            isUser ? "text-right" : "text-left"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <MarkdownContent content={displayedContent} />
              {!isTypingComplete && displayedContent.length > 0 && (
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

        {/* User uploaded images */}
        {message.images && message.images.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.images.map((img, idx) => (
              <motion.img
                key={idx}
                src={img}
                alt={`Uploaded ${idx + 1}`}
                whileHover={{ scale: 1.02 }}
                className="rounded-lg max-w-[280px] max-h-[280px] object-cover border border-muted/50"
              />
            ))}
          </div>
        )}

        {/* AI generated images */}
        {message.generatedImages && message.generatedImages.length > 0 && (
          <div className="mt-3 space-y-3">
            {message.generatedImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative"
              >
                <motion.img
                  src={img}
                  alt={`Generated ${idx + 1}`}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl max-w-[320px] max-h-[320px] object-contain border-2 border-primary/40 shadow-neon"
                />
                <p className="mt-1 text-xs text-center text-primary/70">
                  ✨ Created by Deta AI
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <p className="text-xs font-semibold text-primary mb-2">
              📚 Sources
            </p>
            <div className="space-y-2">
              {message.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg bg-card/40 border border-primary/20 hover:border-primary/40 transition"
                >
                  <p className="text-xs font-medium text-primary truncate">
                    {source.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {source.snippet}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className="mt-3 text-xs text-muted-foreground/70">
          {new Date(message.timestamp).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </motion.div>
    </motion.div>
  );
};
