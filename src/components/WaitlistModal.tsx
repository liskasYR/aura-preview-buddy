import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface WaitlistModalProps {
  isOpen: boolean;
  modelName: string;
  onClose: () => void;
}

export const WaitlistModal = ({ isOpen, modelName, onClose }: WaitlistModalProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call - in production, save to database
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Save to localStorage for demo
    const waitlist = JSON.parse(localStorage.getItem('model_waitlist') || '{}');
    waitlist[modelName] = waitlist[modelName] || [];
    if (!waitlist[modelName].includes(email)) {
      waitlist[modelName].push(email);
      localStorage.setItem('model_waitlist', JSON.stringify(waitlist));
    }
    
    setIsLoading(false);
    setIsSubmitted(true);
    toast.success(`You're on the waitlist for ${modelName}!`);
    
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setEmail("");
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="relative p-6">
              {!isSubmitted ? (
                <>
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                      <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                        <Sparkles className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {modelName} is Coming Soon!
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground text-center mb-6">
                    Be the first to know when {modelName} becomes available. Join our waitlist to get early access!
                  </p>

                  {/* Badge */}
                  <div className="flex justify-center mb-6">
                    <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Coming Soon
                    </span>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-background/50 border-border/50 focus:border-primary"
                    />
                    <Button
                      type="submit"
                      className="w-full h-12 glow-border"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-4 w-4" />
                          </motion.div>
                          Joining...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Join Waitlist
                        </span>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                    className="p-4 rounded-full bg-green-500/20 border border-green-500/30 mb-4"
                  >
                    <Check className="h-10 w-10 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">You're on the list!</h3>
                  <p className="text-muted-foreground text-center">
                    We'll notify you when {modelName} is ready.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
