import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Calendar } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  bio?: string | null;
  verified?: boolean;
  created_at?: string;
}

interface UserPost {
  id: string;
  title: string;
  image_url?: string | null;
  created_at: string;
}

interface UserProfileModalProps {
  profile: UserProfile | null;
  posts: UserPost[];
  open: boolean;
  onClose: () => void;
  onPostClick?: (postId: string) => void;
}

export const UserProfileModal = ({
  profile,
  posts,
  open,
  onClose,
  onPostClick,
}: UserProfileModalProps) => {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Profile Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {profile.full_name ? profile.full_name[0].toUpperCase() : <User className="h-10 w-10" />}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {profile.full_name || "Unknown User"}
                </h2>
                {profile.verified && <VerifiedBadge size="lg" />}
              </div>
              {profile.handle && (
                <p className="text-primary">@{profile.handle}</p>
              )}
            </div>

            {profile.bio && (
              <p className="text-muted-foreground max-w-md">{profile.bio}</p>
            )}

            {profile.created_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined {format(new Date(profile.created_at), "MMMM yyyy")}
              </div>
            )}
          </div>
        </div>

        {/* User Posts */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Posts ({posts.length})</h3>
          
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No posts yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onPostClick?.(post.id)}
                  className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 ring-primary transition-all"
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-primary/20 to-secondary/20">
                      <p className="text-xs text-center text-foreground/80 line-clamp-3">
                        {post.title}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};