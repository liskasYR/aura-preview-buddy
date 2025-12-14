import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Save, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import backgroundImage from "@/assets/background.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const toneOptions = [
  { value: "friendly", label: "😊 Friendly", description: "Warm and approachable" },
  { value: "professional", label: "💼 Professional", description: "Formal and business-like" },
  { value: "casual", label: "😎 Casual", description: "Relaxed and informal" },
  { value: "enthusiastic", label: "🎉 Enthusiastic", description: "Energetic and excited" },
  { value: "calm", label: "🧘 Calm", description: "Peaceful and soothing" },
  { value: "humorous", label: "😄 Humorous", description: "Witty and fun" },
];

const personalityTypes = [
  { value: "assistant", label: "🤖 Assistant", description: "Helpful and task-focused" },
  { value: "mentor", label: "📚 Mentor", description: "Educational and guiding" },
  { value: "creative", label: "🎨 Creative", description: "Imaginative and artistic" },
  { value: "analyst", label: "📊 Analyst", description: "Analytical and data-driven" },
  { value: "companion", label: "🤝 Companion", description: "Supportive and empathetic" },
];

const Personality = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tone, setTone] = useState("friendly");
  const [personalityType, setPersonalityType] = useState("assistant");
  const [customInstructions, setCustomInstructions] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadPersonality(session.user.id);
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

  const loadPersonality = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("personalities")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading personality:", error);
      }

      if (data) {
        setTone(data.tone || "friendly");
        setPersonalityType(data.personality_type || "assistant");
        setCustomInstructions(data.custom_instructions || "");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("personalities")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("personalities")
          .update({
            tone,
            personality_type: personalityType,
            custom_instructions: customInstructions,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personalities")
          .insert({
            user_id: user.id,
            tone,
            personality_type: personalityType,
            custom_instructions: customInstructions,
          });

        if (error) throw error;
      }

      toast.success("Personality settings saved! Deta will now respond according to your preferences.");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save personality settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTone("friendly");
    setPersonalityType("assistant");
    setCustomInstructions("");
    toast.info("Reset to default values");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            onClick={() => navigate("/chat")}
            className="mb-4 hover:bg-sidebar-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>

          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Deta Personality
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize how Deta responds to you
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Tone Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass glow-border">
              <CardHeader>
                <CardTitle>Response Tone</CardTitle>
                <CardDescription>
                  Choose how Deta should communicate with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personality Type */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass glow-border">
              <CardHeader>
                <CardTitle>Personality Type</CardTitle>
                <CardDescription>
                  Select Deta's overall behavior and approach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {personalityTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setPersonalityType(type.value)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        personalityType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card/50"
                      }`}
                    >
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Instructions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass glow-border">
              <CardHeader>
                <CardTitle>Custom Instructions</CardTitle>
                <CardDescription>
                  Add specific instructions for Deta to remember
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Example: Always provide code examples in TypeScript. Remember that I'm working on a React project. Explain concepts as if I'm a beginner..."
                  className="min-h-[150px] bg-background/50"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  These instructions will be remembered and applied to all your conversations with Deta.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4"
          >
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Personality"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Personality;