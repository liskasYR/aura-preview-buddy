import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Save, Camera, AtSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import backgroundImage from "@/assets/background.png";
import { z } from "zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
    handle: "",
    bio: "",
  });
  const [usageStats, setUsageStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalImages: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate("/auth");
        return;
      }

      setUser(currentUser);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // Profile doesn't exist, create one
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || currentUser.email,
          });

        if (!insertError) {
          setProfile({
            full_name: currentUser.user_metadata?.full_name || currentUser.email || "",
            email: currentUser.email || "",
            avatar_url: "",
            handle: "",
            bio: "",
          });
        }
      } else if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || currentUser.email || "",
          avatar_url: profileData.avatar_url || "",
          handle: profileData.handle || "",
          bio: profileData.bio || "",
        });
      }

      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", currentUser.id);

      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .in("conversation_id", conversations?.map(c => c.id) || []);

      const { data: images } = await supabase
        .from("generated_images")
        .select("id")
        .eq("user_id", currentUser.id);

      setUsageStats({
        totalConversations: conversations?.length || 0,
        totalMessages: messages?.length || 0,
        totalImages: images?.length || 0,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const { error } = await supabase
          .from("profiles")
          .update({
            avatar_url: base64,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;

        setProfile(prev => ({ ...prev, avatar_url: base64 }));
        toast.success("Avatar updated successfully");
        setUploadingAvatar(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileSchema = z.object({
        full_name: z.string()
          .trim()
          .min(1, "Name cannot be empty")
          .max(100, "Name must be less than 100 characters"),
        handle: z.string()
          .trim()
          .max(30, "Handle must be less than 30 characters")
          .regex(/^[a-zA-Z0-9_]*$/, "Handle can only contain letters, numbers, and underscores")
          .optional()
          .or(z.literal("")),
        bio: z.string()
          .trim()
          .max(500, "Bio must be less than 500 characters")
          .optional()
          .or(z.literal("")),
      });

      const validated = profileSchema.parse({ 
        full_name: profile.full_name,
        handle: profile.handle,
        bio: profile.bio,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name,
          handle: validated.handle || null,
          bio: validated.bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("This handle is already taken");
          return;
        }
        throw error;
      }
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.name === "ZodError") {
        toast.error(error.issues[0].message);
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 glass">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </h2>

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                          {profile.full_name ? profile.full_name[0].toUpperCase() : <User className="h-12 w-12" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploadingAvatar ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      ) : (
                        <Camera className="h-8 w-8 text-white" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-2">Click to upload avatar</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="handle">Handle (@nickname)</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="handle"
                        value={profile.handle}
                        onChange={(e) =>
                          setProfile({ ...profile, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })
                        }
                        placeholder="your_handle"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Letters, numbers, and underscores only
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      className="mt-2 min-h-[100px]"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Max 500 characters
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full mt-4"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Usage Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="p-6 glass">
                <h2 className="text-xl font-semibold mb-6">Usage History</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card/50 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Conversations</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {usageStats.totalConversations}
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Messages</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {usageStats.totalMessages}
                    </p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Images Generated</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {usageStats.totalImages}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}