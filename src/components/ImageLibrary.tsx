import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  image_data: string | null;
  created_at: string;
}

export const ImageLibrary = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setImages(images.filter(img => img.id !== id));
      toast.success('Image deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const downloadImage = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `deta-${prompt.slice(0, 30)}.png`;
    link.click();
    toast.success('Image downloaded');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Prompt copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-lg">No images generated yet</p>
        <p className="text-sm mt-2">Generate images in chat to see them here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <AnimatePresence>
          {images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary transition-all"
            >
              <img
                src={image.image_data || image.image_url}
                alt={image.prompt}
                className="w-full h-48 object-cover"
              />
              <div className="p-3">
                <p className="text-sm text-foreground line-clamp-2 mb-2">
                  {image.prompt}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(image.prompt)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadImage(image.image_data || image.image_url, image.prompt)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteImage(image.id)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};
