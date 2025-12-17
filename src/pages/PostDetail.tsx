import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, Clock, User, Trash2, Eye, EyeOff, Edit } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserProfileModal } from "@/components/UserProfileModal";

interface PostAuthor {
  full_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  verified?: boolean;
  bio?: string | null;
  id?: string;
  created_at?: string;
}

interface DiscoverPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  published: boolean;
  author?: PostAuthor;
}

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<DiscoverPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<PostAuthor | null>(null);
  const [authorPosts, setAuthorPosts] = useState<DiscoverPost[]>([]);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      const { data: postData, error } = await supabase
        .from("discover_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;

      // Fetch author profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, handle, verified, bio, created_at")
        .eq("id", postData.author_id)
        .single();

      const postWithAuthor = {
        ...postData,
        author: profile || null,
      };

      setPost(postWithAuthor);

      // Check if current user is owner
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isPostOwner = user.id === postData.author_id;
        
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        
        setIsOwner(isPostOwner || !!roleData);
      }
    } catch (error) {
      toast.error("Failed to load post");
      navigate("/discover");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = async () => {
    if (!post) return;

    try {
      const { error } = await supabase
        .from("discover_posts")
        .update({
          title: editTitle,
          content: editContent,
          image_url: editImageUrl || null,
        })
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post updated successfully!");
      setEditingPost(false);
      loadPost();
    } catch (error: any) {
      toast.error("Failed to update post");
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    try {
      const { error } = await supabase
        .from("discover_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post deleted successfully!");
      navigate("/discover");
    } catch (error: any) {
      toast.error("Failed to delete post");
    }
  };

  const handleToggleVisibility = async () => {
    if (!post) return;

    try {
      const { error } = await supabase
        .from("discover_posts")
        .update({ published: !post.published })
        .eq("id", post.id);

      if (error) throw error;

      toast.success(post.published ? "Post is now private" : "Post is now public");
      loadPost();
    } catch (error: any) {
      toast.error("Failed to update visibility");
    }
  };

  const openEditModal = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImageUrl(post.image_url || "");
    setEditingPost(true);
  };

  const openAuthorProfile = async () => {
    if (!post?.author) return;
    
    // Fetch author's posts
    const { data: userPosts } = await supabase
      .from("discover_posts")
      .select("*")
      .eq("author_id", post.author_id)
      .eq("published", true)
      .order("created_at", { ascending: false });
    
    setAuthorPosts(userPosts || []);
    setSelectedAuthor({ ...post.author, id: post.author_id });
  };

  const handleAuthorPostClick = (clickedPostId: string) => {
    setSelectedAuthor(null);
    navigate(`/discover/${clickedPostId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Post not found</p>
        <Button onClick={() => navigate("/discover")}>Back to Discover</Button>
      </div>
    );
  }

  const createdAt = new Date(post.created_at);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/discover")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Button>
        </div>
      </header>

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        {/* Post image */}
        {post.image_url && (
          <div className="w-full aspect-video overflow-hidden rounded-xl mb-8">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Author info */}
        <div className="flex items-center justify-between mb-8">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={openAuthorProfile}
          >
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
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground">
                  {post.author?.full_name || "Unknown Author"}
                </p>
                {post.author?.verified && <VerifiedBadge size="md" />}
              </div>
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
                onClick={openEditModal}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleVisibility}
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
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Date and time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {format(createdAt, "MMMM dd, yyyy")}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {format(createdAt, "HH:mm")}
          </span>
          {!post.published && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
              <EyeOff className="h-3 w-3" />
              Private
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-8">{post.title}</h1>

        {/* Content with markdown support */}
        <div className="prose prose-invert max-w-none prose-lg">
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
      </motion.main>

      {/* User Profile Modal */}
      <UserProfileModal
        profile={selectedAuthor ? {
          id: selectedAuthor.id || "",
          full_name: selectedAuthor.full_name,
          avatar_url: selectedAuthor.avatar_url,
          handle: selectedAuthor.handle,
          bio: selectedAuthor.bio,
          verified: selectedAuthor.verified,
          created_at: selectedAuthor.created_at,
        } : null}
        posts={authorPosts.map(p => ({
          id: p.id,
          title: p.title,
          image_url: p.image_url,
          created_at: p.created_at,
        }))}
        open={!!selectedAuthor}
        onClose={() => setSelectedAuthor(null)}
        onPostClick={handleAuthorPostClick}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Post Modal */}
      <Dialog open={editingPost} onOpenChange={setEditingPost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Make changes to this post</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Post title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL (optional)</label>
              <Input
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content (supports **bold** and `code`)</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Post content"
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPost} disabled={!editTitle || !editContent}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostDetail;
