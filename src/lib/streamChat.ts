import { supabase } from "@/integrations/supabase/client";

type Msg = { 
  role: "user" | "assistant"; 
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>; 
};

export async function streamChat({
  messages,
  model = "LPT-3.5",
  abortSignal,
  onDelta,
  onImage,
  onSources,
  onDone,
  onError,
}: {
  messages: Array<{ 
    role: "user" | "assistant"; 
    content: string; 
    images?: string[];
  }>;
  model?: string;
  abortSignal?: AbortSignal;
  onDelta: (deltaText: string) => void;
  onImage?: (imageUrl: string) => void;
  onSources?: (sources: Array<{ title: string; link: string; snippet: string }>) => void;
  onDone: () => void;
  onError?: (error: string) => void;
}) {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  // Try to get user's session token, fall back to anon key for anonymous users
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Transform messages to support images
  const formattedMessages = messages.map(msg => {
    if (msg.images && msg.images.length > 0) {
      return {
        role: msg.role,
        content: [
          { type: "text", text: msg.content },
          ...msg.images.map(img => ({
            type: "image_url",
            image_url: { url: img }
          }))
        ]
      };
    }
    return { role: msg.role, content: msg.content };
  });

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ messages: formattedMessages, model }),
      signal: abortSignal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "שגיאה לא ידועה" }));
      onError?.(errorData.error || "שגיאה בשליחת ההודעה");
      return;
    }

    if (!resp.body) {
      onError?.("לא התקבלה תשובה");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let chunkCount = 0;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      textBuffer += chunk;
      
      // Faster processing - emit immediately without artificial delays
      chunkCount++;

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check for sources
          if (parsed.sources && onSources) {
            onSources(parsed.sources);
            continue;
          }
          
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
          
          // Check for images in both delta and message
          const deltaImages = parsed.choices?.[0]?.delta?.images;
          const messageImages = parsed.choices?.[0]?.message?.images;
          const images = deltaImages || messageImages;
          
          if (images && onImage) {
            for (const img of images) {
              if (img?.image_url?.url) {
                onImage(img.image_url.url);
              } else if (img?.url) {
                onImage(img.url);
              } else if (typeof img === "string") {
                onImage(img);
              }
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check for sources
          if (parsed.sources && onSources) {
            onSources(parsed.sources);
            continue;
          }
          
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
          
          // Check for images in both delta and message
          const deltaImages = parsed.choices?.[0]?.delta?.images;
          const messageImages = parsed.choices?.[0]?.message?.images;
          const images = deltaImages || messageImages;
          if (images && onImage) {
            for (const img of images) {
              if (img?.image_url?.url) {
                onImage(img.image_url.url);
              } else if (img?.url) {
                onImage(img.url);
              } else if (typeof img === "string") {
                onImage(img);
              }
            }
          }
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream error:", error);
    onError?.(error instanceof Error ? error.message : "שגיאה בחיבור");
  }
}
