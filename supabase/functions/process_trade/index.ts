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
    // Get environment variables from request headers if not available in Deno.env
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || req.headers.get("x-supabase-url") || "";
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_KEY") ||
      req.headers.get("x-supabase-service-key") ||
      "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tradeId, userId } = await req.json();

    if (!tradeId || !userId) {
      throw new Error("Missing required parameters");
    }

    // Get the trade details
    const { data: tradeData, error: tradeError } = await supabase
      .from("trading_history")
      .select("*")
      .eq("id", tradeId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .single();

    if (tradeError || !tradeData) {
      throw new Error("Trade not found or already processed");
    }

    // Get user's trading settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("trading_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (settingsError || !settingsData) {
      throw new Error("Trading settings not found");
    }

    // Get user's account data
    const { data: accountData, error: accountError } = await supabase
      .from("user_accounts")
      .select("*")
      .eq("id", userId)
      .single();

    if (accountError || !accountData) {
      throw new Error("User account not found");
    }

    // Use user's trading settings to determine outcome
    const isWin = Math.random() < settingsData.win_probability;

    // Calculate profit or loss based on settings
    let profitPercentage;
    if (isWin) {
      // Generate profit between min and max profit percentage
      profitPercentage =
        Math.random() *
          (settingsData.max_profit_percentage -
            settingsData.min_profit_percentage) +
        settingsData.min_profit_percentage;
    } else {
      // Generate loss up to max loss percentage (negative value)
      profitPercentage =
        -1 * (Math.random() * settingsData.max_loss_percentage);
    }

    const profitAmount = (tradeData.amount * profitPercentage) / 100;
    const roundedProfit = Math.round(profitAmount * 100) / 100;

    // Calculate new balance and profit values
    const newBalance =
      roundedProfit < 0
        ? accountData.balance + roundedProfit
        : accountData.balance;
    const newProfit =
      roundedProfit > 0
        ? (accountData.profit || 0) + roundedProfit
        : accountData.profit || 0;

    const now = new Date();

    // Update the trade record
    const { error: updateError } = await supabase
      .from("trading_history")
      .update({
        profit_loss: roundedProfit,
        status: roundedProfit > 0 ? "profit" : "loss",
        closed_at: now.toISOString(),
      })
      .eq("id", tradeId);

    if (updateError) {
      throw new Error(`Failed to update trade: ${updateError.message}`);
    }

    // Create a record in trades table
    const { error: tradeInsertError } = await supabase.from("trades").insert({
      user_id: userId,
      crypto_pair: tradeData.crypto_pair,
      trade_type: tradeData.trade_type,
      amount: tradeData.amount,
      profit_loss: roundedProfit,
      status: roundedProfit > 0 ? "profit" : "loss",
      created_at: tradeData.created_at,
      closed_at: now.toISOString(),
    });

    if (tradeInsertError) {
      console.error("Error creating trade record:", tradeInsertError);
    }

    // Update account balance and profit
    const { error: accountUpdateError } = await supabase
      .from("user_accounts")
      .update({
        balance: newBalance,
        profit: newProfit,
      })
      .eq("id", userId);

    if (accountUpdateError) {
      throw new Error(
        `Failed to update account: ${accountUpdateError.message}`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        trade: {
          id: tradeId,
          profit_loss: roundedProfit,
          status: roundedProfit > 0 ? "profit" : "loss",
          closed_at: now.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
