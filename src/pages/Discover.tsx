import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Plus, Edit, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { NewPostModal } from "@/components/NewPostModal";

interface DiscoverPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
}

const Discover = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<DiscoverPost | null>(null);
  const [editingPost, setEditingPost] = useState<DiscoverPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  useEffect(() => {
    loadPosts();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
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
      const { data, error } = await supabase
        .from("discover_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
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

  const openEditModal = (post: DiscoverPost) => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImageUrl(post.image_url || "");
    setEditingPost(post);
    setSelectedPost(null);
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
                  className="h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
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
                    <CardTitle className="text-foreground">{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(post.created_at), "MMM dd, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 line-clamp-3">{post.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Post Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl">{selectedPost.title}</DialogTitle>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(selectedPost)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
                <DialogDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedPost.created_at), "MMMM dd, yyyy")}
                </DialogDescription>
              </DialogHeader>
              {selectedPost.image_url && (
                <div className="w-full rounded-lg overflow-hidden my-4">
                  <img
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              <div className="prose prose-invert max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
              <label className="text-sm font-medium">Content</label>
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