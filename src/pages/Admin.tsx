import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Users, MessageSquare, Image as ImageIcon, UserPlus, Trash2 } from "lucide-react";
import backgroundImage from "@/assets/background.png";

type AppRole = "admin" | "moderator" | "user";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  profile?: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalImages: 0,
  });
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AppRole>("admin");
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/chat");
        return;
      }

      setIsAdmin(true);
      loadStats();
      loadUserRoles();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/chat");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id", { count: "exact" });

      const { data: conversations } = await supabase
        .from("conversations")
        .select("id", { count: "exact" });

      const { data: messages } = await supabase
        .from("messages")
        .select("id", { count: "exact" });

      const { data: images } = await supabase
        .from("generated_images")
        .select("id", { count: "exact" });

      setStats({
        totalUsers: profiles?.length || 0,
        totalConversations: conversations?.length || 0,
        totalMessages: messages?.length || 0,
        totalImages: images?.length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = data?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const rolesWithProfiles: UserRole[] = data?.map(role => ({
        ...role,
        role: role.role as AppRole,
        profile: profiles?.find(p => p.id === role.user_id)
      })) || [];

      setUserRoles(rolesWithProfiles);
    } catch (error) {
      console.error("Error loading user roles:", error);
    }
  };

  const handleAddUserRole = async () => {
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setAddingUser(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", newAdminEmail.trim())
        .single();

      if (profileError || !profile) {
        toast.error("User not found. Make sure the user has signed up first.");
        return;
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .eq("role", newAdminRole)
        .single();

      if (existingRole) {
        toast.error("User already has this role");
        return;
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.id,
          role: newAdminRole
        });

      if (insertError) throw insertError;

      toast.success(`${newAdminRole === 'admin' ? 'Admin' : 'User'} role added successfully!`);
      setNewAdminEmail("");
      loadUserRoles();
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast.error(error.message || "Failed to add role");
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to remove this role?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Role removed successfully");
      loadUserRoles();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove role");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-8">
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
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">System statistics and management</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <Users className="h-12 w-12 text-primary/20" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="p-6 glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversations</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {stats.totalConversations}
                    </p>
                  </div>
                  <MessageSquare className="h-12 w-12 text-primary/20" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="p-6 glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Messages</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {stats.totalMessages}
                    </p>
                  </div>
                  <MessageSquare className="h-12 w-12 text-primary/20" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="p-6 glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Generated Images</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {stats.totalImages}
                    </p>
                  </div>
                  <ImageIcon className="h-12 w-12 text-primary/20" />
                </div>
              </Card>
            </motion.div>
          </div>

          {/* User Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="p-6 glass">
              <div className="flex items-center gap-3 mb-6">
                <UserPlus className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">User Management</h2>
              </div>

              {/* Add User Form */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-background/50 rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="user-email">User Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="user@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-40 space-y-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Select value={newAdminRole} onValueChange={(v: AppRole) => setNewAdminRole(v)}>
                    <SelectTrigger id="user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddUserRole}
                    disabled={addingUser}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {addingUser ? "Adding..." : "Add Role"}
                  </Button>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Current Users with Roles</h3>
                {userRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No users with special roles yet</p>
                ) : (
                  <div className="space-y-2">
                    {userRoles.map((userRole) => (
                      <div
                        key={userRole.id}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${userRole.role === 'admin' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">{userRole.profile?.email || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {userRole.profile?.full_name || 'No name'} · {userRole.role}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRole(userRole.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}