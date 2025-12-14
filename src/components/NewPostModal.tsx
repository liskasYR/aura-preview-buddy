import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Image, FileText, Eye, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface NewPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onCreatePost?: (post: { title: string; content: string; image_url?: string }) => void;
}

export const NewPostModal = ({ open, onOpenChange, isAdmin, onCreatePost }: NewPostModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onCreatePost?.({ title, content, image_url: imageUrl || undefined });
    setTitle("");
    setContent("");
    setImageUrl("");
    onOpenChange(false);
  };

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              Staff Only Feature
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Access restricted to authorized personnel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-primary/10 border border-primary/20"
            >
              <h3 className="font-bold text-lg text-foreground mb-2">What is New Post?</h3>
              <p className="text-sm text-muted-foreground">
                The New Post feature allows staff members to create and publish announcements,
                updates, and content for all users to see in the Discover section.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg bg-secondary/10 border border-secondary/20"
            >
              <h3 className="font-bold text-lg text-foreground mb-2">Staff Features Include:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Create rich text posts with formatting
                </li>
                <li className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" />
                  Add images and media to posts
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Schedule posts for future dates
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-muted/50 border border-border"
            >
              <p className="text-sm text-muted-foreground">
                If you believe you should have staff access, please contact the administrator.
              </p>
            </motion.div>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Post</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share updates with your community
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Options Section */}
          <div className="flex gap-2">
            <Button
              variant={!showPreview ? "default" : "outline"}
              onClick={() => setShowPreview(false)}
              className="flex-1 font-bold"
            >
              <FileText className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={showPreview ? "default" : "outline"}
              onClick={() => setShowPreview(true)}
              className="flex-1 font-bold"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {showPreview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border min-h-[300px]"
            >
              <h2 className="text-xl font-bold">{title || "Post Title"}</h2>
              {imageUrl && (
                <div className="w-full h-48 overflow-hidden rounded-lg">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
              <p className="text-foreground/80 whitespace-pre-wrap">
                {content || "Post content will appear here..."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="title" className="font-bold">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="font-bold">
                  Image URL (Optional)
                </Label>
                <Input
                  id="image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="font-bold">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content..."
                  className="bg-background/50 min-h-[150px]"
                />
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            className="flex-1 font-bold"
          >
            Publish Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};