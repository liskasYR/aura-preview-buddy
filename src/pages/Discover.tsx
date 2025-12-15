import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Plus, Edit, User, Eye, EyeOff, Trash2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { NewPostModal } from "@/components/NewPostModal";
import { PostDetailModal } from "@/components/PostDetailModal";
import { UserProfileModal } from "@/components/UserProfileModal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

const Discover = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<DiscoverPost | null>(null);
  const [editingPost, setEditingPost] = useState<DiscoverPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<PostAuthor | null>(null);
  const [authorPosts, setAuthorPosts] = useState<DiscoverPost[]>([]);

  useEffect(() => {
    loadPosts();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setCurrentUserId(user?.id || null);
      
      if (!user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      // User is not admin
    }
  };

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from("discover_posts")
        .select("*")
        .order("created_at", { ascending: false });

      // If user is logged in, show their private posts too
      if (user) {
        query = query.or(`published.eq.true,author_id.eq.${user.id}`);
      } else {
        query = query.eq("published", true);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // Fetch author profiles with verified and bio
      const authorIds = [...new Set(postsData?.map(p => p.author_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, handle, verified, bio, created_at")
        .in("id", authorIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const postsWithAuthors = postsData?.map(post => ({
        ...post,
        author: profilesMap.get(post.author_id) || null,
      })) || [];

      setPosts(postsWithAuthors);
    } catch (error: any) {
      toast.error("Failed to load posts");
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (post: { title: string; content: string; image_url?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to create posts");
        return;
      }

      const { error } = await supabase
        .from("discover_posts")
        .insert({
          title: post.title,
          content: post.content,
          image_url: post.image_url || null,
          author_id: user.id,
          published: true,
        });

      if (error) throw error;

      toast.success("Post created successfully!");
      setShowNewPostModal(false);
      loadPosts();
    } catch (error: any) {
      toast.error("Failed to create post");
      console.error("Error creating post:", error);
    }
  };

  const handleEditPost = async () => {
    if (!editingPost) return;

    try {
      const { error } = await supabase
        .from("discover_posts")
        .update({
          title: editTitle,
          content: editContent,
          image_url: editImageUrl || null,
        })
        .eq("id", editingPost.id);

      if (error) throw error;

      toast.success("Post updated successfully!");
      setEditingPost(null);
      setSelectedPost(null);
      loadPosts();
    } catch (error: any) {
      toast.error("Failed to update post");
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      const { error } = await supabase
        .from("discover_posts")
        .delete()
        .eq("id", deletePostId);

      if (error) throw error;

      toast.success("Post deleted successfully!");
      setDeletePostId(null);
      setSelectedPost(null);
      loadPosts();
    } catch (error: any) {
      toast.error("Failed to delete post");
      console.error("Error deleting post:", error);
    }
  };

  const handleToggleVisibility = async (post: DiscoverPost) => {
    try {
      const { error } = await supabase
        .from("discover_posts")
        .update({ published: !post.published })
        .eq("id", post.id);

      if (error) throw error;

      toast.success(post.published ? "Post is now private" : "Post is now public");
      setSelectedPost(null);
      loadPosts();
    } catch (error: any) {
      toast.error("Failed to update visibility");
      console.error("Error updating visibility:", error);
    }
  };

  const openEditModal = (post: DiscoverPost) => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImageUrl(post.image_url || "");
    setEditingPost(post);
    setSelectedPost(null);
  };

  const isPostOwner = (post: DiscoverPost) => {
    return currentUserId === post.author_id || isAdmin;
  };

  const openAuthorProfile = async (author: PostAuthor | undefined, authorId: string) => {
    if (!author) return;
    
    // Fetch author's posts
    const { data: userPosts } = await supabase
      .from("discover_posts")
      .select("*")
      .eq("author_id", authorId)
      .eq("published", true)
      .order("created_at", { ascending: false });
    
    setAuthorPosts(userPosts || []);
    setSelectedAuthor({ ...author, id: authorId });
    setSelectedPost(null);
  };

  const handleAuthorPostClick = (postId: string) => {
    const post = posts.find(p => p.id === postId) || authorPosts.find(p => p.id === postId);
    if (post) {
      setSelectedAuthor(null);
      setSelectedPost(post as DiscoverPost);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
              className="hover:bg-sidebar-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Discover</h1>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowNewPostModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No posts yet</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer relative ${
                    !post.published ? "opacity-70 border-dashed" : ""
                  }`}
                  onClick={() => setSelectedPost(post)}
                >
                  {!post.published && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Private
                      </span>
                    </div>
                  )}
                  {post.image_url && (
                    <div className="w-full h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    {/* Author avatar */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        {post.author?.avatar_url ? (
                          <AvatarImage src={post.author.avatar_url} alt={post.author.full_name || "Author"} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {post.author?.full_name?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        {post.author?.full_name || "Unknown"}
                        {post.author?.verified && (
                          <CheckCircle className="h-3.5 w-3.5 text-primary fill-primary/20" />
                        )}
                        {post.author?.handle && (
                          <span className="text-primary ml-1">@{post.author.handle}</span>
                        )}
                      </span>
                    </div>
                    <CardTitle className="text-foreground">{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(post.created_at), "MMM dd, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-foreground/80 line-clamp-3 prose prose-sm prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {post.content.substring(0, 150)}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        isOwner={selectedPost ? isPostOwner(selectedPost) : false}
        onEdit={() => selectedPost && openEditModal(selectedPost)}
        onDelete={() => selectedPost && setDeletePostId(selectedPost.id)}
        onToggleVisibility={() => selectedPost && handleToggleVisibility(selectedPost)}
        onAuthorClick={() => selectedPost && openAuthorProfile(selectedPost.author, selectedPost.author_id)}
      />

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
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
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
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
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
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditPost} disabled={!editTitle || !editContent}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Post Modal */}
      <NewPostModal
        open={showNewPostModal}
        onOpenChange={setShowNewPostModal}
        isAdmin={isAdmin}
        onCreatePost={handleCreatePost}
      />
    </div>
  );
};

export default Discover;