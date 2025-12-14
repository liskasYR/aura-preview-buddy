import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting for anonymous users (resets on function restart)
const anonymousRateLimits = new Map<string, { count: number; resetTime: number }>();
const ANONYMOUS_LIMIT = 5; // 5 transcriptions per hour for anonymous users
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function checkAnonymousRateLimit(clientIP: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = anonymousRateLimits.get(clientIP);
  
  if (!record || now > record.resetTime) {
    anonymousRateLimits.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: ANONYMOUS_LIMIT - 1 };
  }
  
  if (record.count >= ANONYMOUS_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: ANONYMOUS_LIMIT - record.count };
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if user is authenticated
    const authHeader = req.headers.get('authorization');
    let isAuthenticated = false;
    
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      isAuthenticated = !!user;
    }
    
    // Apply rate limiting for anonymous users
    if (!isAuthenticated) {
      const clientIP = getClientIP(req);
      const { allowed, remaining } = checkAnonymousRateLimit(clientIP);
      
      if (!allowed) {
        console.log(`Rate limit exceeded for anonymous user: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please sign in for unlimited access.',
            code: 'RATE_LIMIT_EXCEEDED'
          }),
          {
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': '0'
            },
          }
        );
      }
      
      console.log(`Anonymous transcription request from ${clientIP}. Remaining: ${remaining}`);
    }

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Transcribe error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
