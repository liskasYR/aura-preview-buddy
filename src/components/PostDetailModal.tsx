import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, Clock, User, Trash2, Eye, EyeOff, Edit } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PostAuthor {
  full_name: string | null;
  avatar_url: string | null;
  handle: string | null;
}

interface PostDetailModalProps {
  post: {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
    author_id: string;
    published: boolean;
    author?: PostAuthor;
  } | null;
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
}

export const PostDetailModal = ({
  post,
  open,
  onClose,
  isOwner,
  onEdit,
  onDelete,
  onToggleVisibility,
}: PostDetailModalProps) => {
  if (!post) return null;

  const createdAt = new Date(post.created_at);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Back button header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            ← back to Discover
          </Button>
        </div>

        {/* Post image */}
        {post.image_url && (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Post content */}
        <div className="p-6 space-y-6">
          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {post.author?.avatar_url ? (
                  <AvatarImage src={post.author.avatar_url} alt={post.author.full_name || "Author"} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {post.author?.full_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">
                  {post.author?.full_name || "Unknown Author"}
                </p>
                {post.author?.handle && (
                  <p className="text-sm text-primary">@{post.author.handle}</p>
                )}
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleVisibility}
                  className="gap-2"
                >
                  {post.published ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Make Public
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Date and time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(createdAt, "MMMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {format(createdAt, "HH:mm")}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground">{post.title}</h1>

          {/* Content with markdown support */}
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ children }) => (
                  <strong className="font-bold text-foreground">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-sm">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    {children}
                  </pre>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
