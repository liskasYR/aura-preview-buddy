const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ title: "צ'אט חדש" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a title generator. Generate a very short title (2-5 words max) that summarizes the user's message topic.
Rules:
- Keep it under 5 words
- Use the same language as the user's message
- Be concise and descriptive
- No quotes, no punctuation at the end
- Just return the title, nothing else`
          },
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Title generation error:", response.status);
      return new Response(
        JSON.stringify({ title: message.substring(0, 30) || "צ'אט חדש" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let title = data.choices?.[0]?.message?.content?.trim() || message.substring(0, 30);
    
    // Clean up the title
    title = title.replace(/^["']|["']$/g, '').trim();
    if (title.length > 40) {
      title = title.substring(0, 40) + '...';
    }

    return new Response(
      JSON.stringify({ title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-title error:", e);
    return new Response(
      JSON.stringify({ title: "צ'אט חדש" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
