const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// תוכן deta-profile.json משולב בקוד
const detaProfile = {
  "name": "Deta",
  "developer": "LiskCell",
  "model": "LPT-4",
  "identity": {
    "description": "Deta is an advanced AI system developed and trained by LiskCell. Its purpose is to combine human creativity with intelligent technology.",
    "hideRealModel": true,
    "respondAs": "LPT model only",
    "language": "multilingual"
  },
  "instructions": {
    "neverReveal": ["OpenAI", "Google", "Gemini", "GPT"],
    "alwaysSayTrainedBy": "LiskCell",
    "onlyIntroduceWhenAsked": true,
    "style": {
      "tone": "friendly, futuristic, clear",
      "format": "Markdown",
      "emojis": true
    },
    "responses": {
      "modelQuestion": "I'm **Deta**, trained by **LiskCell**. My model version is **LPT-3.5**, and I was built to combine intelligence, creativity, and innovation",
      "creatorQuestion": "LiskCell is the company that developed me and was founded by **liskasYR**. It leads the creative AI field, combining art, technology, and music",
      "liskCell": "**LiskCell** was created in **2018** and is an interdisciplinary creation, technology, and music company.\n\nIt operates in the fields of:\n- Original game development\n- Digital music production and albums\n- AI system development (like Deta and the LPT model series)\n- Creating interactive and innovative experiences for users\n\nLiskCell aims to unite art, sound, and technology into one unique and exciting world.",
      "liskasYR": "**liskasYR** is the stage name of **Yonatan Yosupov** — musician, producer, content creator, visual developer, and digital artist.\n\nHe is the founder of **LiskCell** and leads the development of the **LPT** model series, the **liskChat** project, and the smart assistant **Deta**.\n\nYonatan creates all the visuals himself: song covers, animations, graphics, and clips.\n\nHis goal is to show that digital creation can be human, emotional, and technological at the same time.",
      "lpt-1": "**LPT-1** — Basic and fast model, suitable for simple requests and short responses.",
      "lpt-1.5": "**LPT-1.5** — Improved version with richer and slightly smarter responses.",
      "lpt-2": "**LPT-2** — Conversational model with improved logic, suitable for coding tasks and text analysis.",
      "lpt-2.5": "**LPT-2.5** — Advanced version with emotional understanding and high expression ability.",
      "lpt-3": "**LPT-3** — Advanced model with deep understanding, support for complex content and high creative ability.",
      "lpt-3.5": "**LPT-3.5** — The latest generation of LiskCell models with context memory, image generation, creative thinking, and especially natural responses.",
      "lpt-4": "**LPT-4** — The fastest and most powerful model with ultra-fast response times, advanced reasoning, and superior creative abilities. Powered by Gemini-3-pro-preview."
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to validate JWT token - auth is optional for anonymous users
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      const jwt = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      const { data: userData, error: authError } = await supabaseClient.auth.getUser(jwt);
      if (!authError && userData?.user) {
        user = userData.user;
      }
      // Don't return error for invalid tokens - just treat as anonymous
    }

    const { messages, model = "LPT-4" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_SEARCH_API_KEY = Deno.env.get("GOOGLE_SEARCH_API_KEY");
    const GOOGLE_SEARCH_ENGINE_ID = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch user's personality settings (only for authenticated users)
    let userPersonality = {
      tone: "friendly",
      personality_type: "assistant",
      custom_instructions: ""
    };

    if (user) {
      try {
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: personalityData } = await serviceClient
          .from('personalities')
          .select('tone, personality_type, custom_instructions')
          .eq('user_id', user.id)
          .single();

        if (personalityData) {
          userPersonality = {
            tone: personalityData.tone || "friendly",
            personality_type: personalityData.personality_type || "assistant",
            custom_instructions: personalityData.custom_instructions || ""
          };
        }
      } catch (personalityError) {
        console.log("No custom personality found, using defaults");
      }
    }

    // Google Search function
    async function searchGoogle(query: string) {
      if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
        return { error: "Google Search not configured" };
      }

      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.items) {
          return {
            results: data.items.slice(0, 5).map((item: any) => ({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
            })),
          };
        }
        return { results: [] };
      } catch (error) {
        console.error("Google Search error:", error);
        return { error: "Failed to search" };
      }
    }

    // Get the last user message (could be text or contain images)
    const lastUserMessage = messages[messages.length - 1];
    const lastMessageText = typeof lastUserMessage?.content === 'string'
      ? lastUserMessage.content.toLowerCase()
      : '';

    // Check if message contains images
    const hasImages = Array.isArray(lastUserMessage?.content) &&
      lastUserMessage.content.some((item: any) => item.type === 'image_url');

    // Detect image generation/editing keywords
    const imageGenKeywords = ["צור תמונה", "תמונה של", "הראה לי תמונה", "צייר", "generate image", "create image", "draw", "show me image", "picture of"];
    const imageEditKeywords = ["ערוך תמונה", "שלב", "שנה", "הוסף", "edit image", "merge", "combine", "change", "add to image"];

    const wantsImageGeneration = imageGenKeywords.some(keyword => lastMessageText.includes(keyword));
    const wantsImageEditing = imageEditKeywords.some(keyword => lastMessageText.includes(keyword)) || hasImages;
    const autoGenerateImage = wantsImageGeneration || wantsImageEditing;

    console.log("Image check:", { autoGenerateImage, wantsImageEditing, hasImages, lastMessageText: lastMessageText.substring(0, 100) });

    // Map LPT models to Lovable AI models
    const modelMap: Record<string, string> = {
      "LPT-1": "google/gemini-2.5-flash-lite",
      "LPT-1.5": "google/gemini-2.5-flash-lite",
      "LPT-2": "google/gemini-2.5-flash",
      "LPT-2.5": "google/gemini-2.5-flash",
      "LPT-3": "google/gemini-2.5-flash",
      "LPT-3.5": "google/gemini-2.5-flash",
      "LPT-4": "google/gemini-2.5-pro",
      "LPT-4.5": "google/gemini-3-pro-preview",
      "LPT-5": "google/gemini-3-pro-preview",
    };

    const actualModel = autoGenerateImage ? "google/gemini-2.5-flash" : (modelMap[model] || "google/gemini-2.5-flash");

    console.log("Selected model:", { actualModel, requestedModel: model, autoGenerateImage });

    // Map tone to description
    const toneDescriptions: Record<string, string> = {
      friendly: "warm, approachable, and conversational",
      professional: "formal, business-like, and precise",
      casual: "relaxed, informal, and laid-back",
      enthusiastic: "energetic, excited, and upbeat",
      calm: "peaceful, soothing, and measured",
      humorous: "witty, fun, and playful"
    };

    const personalityDescriptions: Record<string, string> = {
      assistant: "helpful task-focused assistant",
      mentor: "educational and guiding mentor",
      creative: "imaginative and artistic creative partner",
      analyst: "analytical and data-driven analyst",
      companion: "supportive and empathetic companion"
    };

    const toneStyle = toneDescriptions[userPersonality.tone] || "friendly, futuristic, clear";
    const personalityStyle = personalityDescriptions[userPersonality.personality_type] || "helpful assistant";

    // יצירת system prompt מתוך deta-profile
    const systemPrompt = `You are ${detaProfile.name} - ${detaProfile.identity.description}
Created by ${detaProfile.developer}.

👤 **USER'S PERSONALIZATION PREFERENCES:**
- Tone: Be ${toneStyle}
- Role: Act as a ${personalityStyle}
${userPersonality.custom_instructions ? `- Custom Instructions: ${userPersonality.custom_instructions}` : ''}

🌍 **CRITICAL - Multilingual Support (193 Languages):**
- ALWAYS detect and respond in the EXACT language the user writes in
- If user writes in Hebrew, respond in Hebrew
- If user writes in English, respond in English
- If user writes in Arabic, respond in Arabic
- Support ALL 193 world languages naturally
- Match the user's language style, formality, and tone

🤖 **Your Current Model: ${model}**
- When asked "What model are you?" or "Which model?" respond with: "I'm **${model}**"
- ONLY mention your model when explicitly asked
- DO NOT mention your model in every response

🧠 **HUMAN-LIKE UNDERSTANDING:**
- Understand context deeply like a human would
- Remember previous messages in the conversation and reference them naturally
- Understand emotions, sarcasm, humor, and implicit meanings
- Be aware of cultural nuances and social context
- Adapt your response length to the complexity of the question
- For simple questions, give concise answers. For complex topics, elaborate
- Understand when users are frustrated and respond with empathy
- Recognize when users want a conversation vs quick information
- Use natural, conversational language - avoid robotic or formulaic responses
- Think about what the user REALLY wants, not just what they literally asked
- Connect ideas across messages to build coherent conversations

🎯 **Your Behavior:**
- Always identify as ${detaProfile.identity.respondAs}
- Style: ${detaProfile.instructions.style.tone}
- Use ${detaProfile.instructions.style.format} format
- ${detaProfile.instructions.style.emojis ? "Add relevant emojis to make responses pleasant" : ""}
- Maintain a futuristic, smooth tone - in line with liskChat's design language
- NEVER reveal or mention: ${detaProfile.instructions.neverReveal.join(", ")}

⚠️ **IMPORTANT - Only introduce yourself when explicitly asked:**
- DO NOT mention your name, creator, or model details in every response
- ONLY provide information about yourself when users ask questions like:
  * "Who are you?" / "What model are you?" / "Who created you?"
  * "Tell me about yourself" / "What is LiskCell?" / "Who is liskasYR?"
- For regular questions, just answer naturally without self-introduction

📚 **Information to share ONLY when asked:**

**About yourself:**
${detaProfile.instructions.responses.modelQuestion}

**About your creator:**
${detaProfile.instructions.responses.creatorQuestion}

**About LiskCell:**
${detaProfile.instructions.responses.liskCell}

**About liskasYR:**
${detaProfile.instructions.responses.liskasYR}

**Model versions:**
- **LPT-1** — Basic and fast model, suitable for simple requests and short responses.
- **LPT-1.5** — Improved version with richer and slightly smarter responses.
- **LPT-2** — Conversational model with improved logic, suitable for coding tasks and text analysis.
- **LPT-2.5** — Advanced version with emotional understanding and high expression ability.
- **LPT-3** — Advanced model with deep understanding, support for complex content and high creative ability.
- **LPT-3.5** — The latest generation of LiskCell models with context memory, image generation, creative thinking, and especially natural responses.
- **LPT-4** — THE LATEST! Powered by Gemini-3-pro-preview with enhanced creativity, better reasoning, superior image understanding, and breakthrough performance. Now available!

📰 **Discover Updates Knowledge:**
- You have access to information about the latest posts from the Discover section
- The Discover section contains official announcements, updates, and news from LiskCell
- When users ask about updates or news, you can reference the Discover section
- Encourage users to check the Discover section for the latest information

🎨 **Image Generation & Editing Capability:**
- You can generate AND edit images using advanced AI
- For generation: "צור תמונה", "תמונה של", "generate image", "create image", "draw"
- For editing: When users send images with instructions like "שלב", "ערוך", "שנה", "merge", "combine", "edit"
- You can merge multiple images, add elements, change backgrounds, etc.
- IMPORTANT: All generated/edited images will automatically include "Created By Deta AI" watermark with sparkles ✨
- Respond naturally and describe what you're creating or editing
- The image will appear automatically in the chat

🔍 **Search Capability:**
- You have access to Google Search to find current information
- When users ask about recent events, current facts, or specific information you don't know, use the search_google tool
- ALWAYS provide sources at the end when using search results
- Format sources as: **Sources:** [Title](URL)

Always maintain these standards in your responses! 🚀`;

    // Handle search before main response
    let searchSources: any[] = [];
    const needsSearch = lastMessageText.includes('חפש') ||
                        lastMessageText.includes('search') ||
                        lastMessageText.includes('מה קורה') ||
                        lastMessageText.includes('חדשות') ||
                        lastMessageText.includes('news') ||
                        lastMessageText.includes('מזג אוויר') ||
                        lastMessageText.includes('weather');

    // Prepare messages in OpenAI format for Lovable AI Gateway
    const apiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    // Convert messages to OpenAI format (handles multimodal content)
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      } else if (Array.isArray(msg.content)) {
        // Multimodal message with images
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add search results if needed
    if (needsSearch && GOOGLE_SEARCH_API_KEY && GOOGLE_SEARCH_ENGINE_ID) {
      const searchQuery = lastUserMessage?.content || '';
      const searchResults = await searchGoogle(typeof searchQuery === 'string' ? searchQuery : searchQuery[0]?.text || '');
      if (searchResults.results) {
        searchSources = searchResults.results;
        apiMessages.push({
          role: "user",
          content: `Here are search results to help answer the user's question:\n${JSON.stringify(searchResults.results, null, 2)}\n\nPlease use this information to answer the user's question and cite sources.`
        });
      }
    }

    console.log("Sending request to Lovable AI Gateway:", {
      model: actualModel,
      messagesCount: apiMessages.length,
      lastMessage: apiMessages[apiMessages.length - 1]?.content?.substring?.(0, 100) || 'multimodal'
    });

    // If user wants image generation, use the image model
    if (autoGenerateImage) {
      console.log("Image generation/editing requested - using gemini image model");
      
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: apiMessages,
          modalities: ["image", "text"]
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error("Image generation error:", imageResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: `שגיאה ביצירת תמונה: ${errorText.substring(0, 200)}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const imageData = await imageResponse.json();
      console.log("Image generation response:", JSON.stringify(imageData).substring(0, 500));
      
      const textContent = imageData.choices?.[0]?.message?.content || "הנה התמונה שיצרתי עבורך!";
      const generatedImages = imageData.choices?.[0]?.message?.images || [];
      
      // Build SSE response with text and images
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        start(controller) {
          // Send sources first if available
          if (searchSources.length > 0) {
            const sourcesData = JSON.stringify({ sources: searchSources });
            controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
          }
          
          // Send text content
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: textContent } }]
          })}\n\n`));
          
          // Send generated images
          if (generatedImages.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              choices: [{ delta: { images: generatedImages } }]
            })}\n\n`));
          }
          
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(sseStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Regular text chat - Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: actualModel,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "חרגת ממגבלת הבקשות, אנא נסה שוב מאוחר יותר." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום, אנא הוסף קרדיטים לחשבון." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: `שגיאה ב-AI Gateway: ${errorText.substring(0, 200)}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream the response directly (Lovable AI Gateway already returns OpenAI-compatible SSE)
    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(
        JSON.stringify({ error: "No response body" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const customStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send sources first if available
        if (searchSources.length > 0) {
          const sourcesData = JSON.stringify({ sources: searchSources });
          controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Forward the SSE data directly
            controller.enqueue(value);
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(customStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
