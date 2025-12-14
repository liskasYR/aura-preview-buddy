import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NewPostNotificationProps {
  isVisible: boolean;
  title: string;
  preview: string;
  imageUrl?: string | null;
  postId?: string;
  onClose: () => void;
}

// Track seen posts in localStorage
const getSeenPosts = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('seen_posts') || '[]');
  } catch {
    return [];
  }
};

const markPostAsSeen = (postId: string) => {
  const seenPosts = getSeenPosts();
  if (!seenPosts.includes(postId)) {
    seenPosts.push(postId);
    localStorage.setItem('seen_posts', JSON.stringify(seenPosts));
  }
};

export const hasSeenPost = (postId: string): boolean => {
  return getSeenPosts().includes(postId);
};

export const NewPostNotification = ({
  isVisible,
  title,
  preview,
  imageUrl,
  postId,
  onClose,
}: NewPostNotificationProps) => {
  const navigate = useNavigate();

  const handleCheckOut = () => {
    if (postId) {
      markPostAsSeen(postId);
    }
    onClose();
    navigate("/discover");
  };

  const handleClose = () => {
    if (postId) {
      markPostAsSeen(postId);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Header image or gradient */}
            <div className="relative h-48 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              
              {/* New badge overlay */}
              <div className="absolute top-4 left-4">
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Bell className="h-4 w-4" />
                  New Post
                </motion.span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Sparkle icon */}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm text-primary font-medium">Just Published</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-foreground mb-3 line-clamp-2">
                {title}
              </h2>

              {/* Preview text */}
              <p className="text-muted-foreground text-base line-clamp-3 mb-6">
                {preview}
              </p>

              {/* CTA Button */}
              <Button
                onClick={handleCheckOut}
                className="w-full h-12 glow-border justify-center gap-2 group text-lg"
              >
                Check it out
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
