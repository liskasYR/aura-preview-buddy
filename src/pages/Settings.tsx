import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Bell, Globe, Shield, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import backgroundImage from "@/assets/background.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { conversationStorage } from "@/lib/conversationStorage";

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("auto");
  const [privacy, setPrivacy] = useState(true);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!");
  };

  const handleExportData = () => {
    const conversations = conversationStorage.getAll();
    const dataStr = JSON.stringify(conversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deta-conversations-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const handleClearAllData = () => {
    if (confirm("Are you sure you want to delete all conversations? This cannot be undone.")) {
      conversationStorage.deleteAll();
      toast.success("All data cleared");
    }
  };

  return (
    <div 
      className="min-h-screen p-6 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 hover:bg-sidebar-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your Deta AI experience
          </p>
        </motion.div>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass glow-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account
                </CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Notifications</Label>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass glow-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Language & Region
                </CardTitle>
                <CardDescription>
                  Choose your preferred language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Response Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="he">עברית (Hebrew)</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                      <SelectItem value="es">Español (Spanish)</SelectItem>
                      <SelectItem value="fr">Français (French)</SelectItem>
                      <SelectItem value="de">Deutsch (German)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Deta supports all 193 world languages. Set to "Auto-detect" for best experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass glow-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control your data and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="privacy">Save Conversation History</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Store your conversations for future reference
                    </p>
                  </div>
                  <Switch
                    id="privacy"
                    checked={privacy}
                    onCheckedChange={setPrivacy}
                  />
                </div>
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All Conversations
                  </Button>
                  <Button
                    onClick={handleClearAllData}
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleSaveSettings}
              className="w-full gradient-primary shadow-neon hover:shadow-glow"
            >
              Save Settings
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
