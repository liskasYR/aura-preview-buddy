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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex w-full max-w-2xl overflow-hidden rounded-2xl border border-border/30 bg-card/95 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - X at top right */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors z-10 bg-background/50"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Left side - Image or gradient */}
            <div className="relative w-1/2 min-h-[280px] overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" />
              )}
            </div>

            {/* Right side - Content */}
            <div className="flex flex-col justify-center w-1/2 p-6 gap-4">
              {/* New badge */}
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-fit px-3 py-1 rounded-full bg-muted text-foreground text-sm font-medium"
              >
                New
              </motion.span>

              {/* Title */}
              <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-3">
                {title}
              </h2>

              {/* Preview with bullet points style */}
              <div className="space-y-2">
                {preview.split('\n').slice(0, 4).map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="line-clamp-1">{line || preview.slice(0, 50)}</span>
                  </div>
                ))}
                {!preview.includes('\n') && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleCheckOut}
                variant="outline"
                className="w-full h-10 justify-center gap-2 group mt-2 bg-background hover:bg-muted"
              >
                Check it out
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
