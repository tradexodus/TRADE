import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body if any
    let checkTime = new Date();
    try {
      if (req.method === "POST") {
        const body = await req.json();
        if (body && body.checkTime) {
          checkTime = new Date(body.checkTime);
        }
      }
    } catch (e) {
      // Ignore parsing errors, use default checkTime
    }

    // Call the database function to process expired trades
    const { data, error } = await supabase.rpc("process_expired_trades");

    if (error) {
      throw error;
    }

    // Count processed trades (this is a placeholder since the actual count isn't returned by the function)
    // In a real implementation, you might modify the process_expired_trades function to return this count
    const processed = 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pending trades processed",
        processed: processed,
        checkTime: checkTime.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
