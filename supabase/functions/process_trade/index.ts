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
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { tradeId, userId } = await req.json();

    if (!tradeId || !userId) {
      throw new Error("Missing trade ID or user ID");
    }

    // Get trade details
    const { data: tradeData, error: tradeError } = await supabase
      .from("trading_history")
      .select("*")
      .eq("id", tradeId)
      .eq("user_id", userId)
      .single();

    if (tradeError) {
      throw tradeError;
    }

    if (!tradeData) {
      throw new Error("Trade not found");
    }

    // Check if trade is already processed
    if (tradeData.status !== "pending") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Trade already processed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Get user's trading settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("trading_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      throw settingsError;
    }

    // Default settings if none found
    const defaultSettings = {
      win_probability: 0.65, // 65% chance to win
      min_profit_percentage: 0.8, // 0.8%
      max_profit_percentage: 1.5, // 1.5%
      max_loss_percentage: 0.95, // 0.95%
    };

    // Use settings from database or defaults
    const settings = settingsData || defaultSettings;

    // Get user's account data
    const { data: accountData, error: accountError } = await supabase
      .from("user_accounts")
      .select("*")
      .eq("id", userId)
      .single();

    if (accountError) {
      throw accountError;
    }

    // Determine if the trade is a win or loss based on probability
    const isWin = Math.random() < settings.win_probability;

    // Calculate profit or loss
    let profitPercentage;
    if (isWin) {
      // Generate profit between min and max profit percentage
      profitPercentage =
        Math.random() *
          (settings.max_profit_percentage - settings.min_profit_percentage) +
        settings.min_profit_percentage;
    } else {
      // Generate loss up to max loss percentage (negative value)
      profitPercentage = -1 * (Math.random() * settings.max_loss_percentage);
    }

    const profitAmount = (tradeData.amount * profitPercentage) / 100;
    const roundedProfit = Math.round(profitAmount * 100) / 100;

    // IMPORTANT: Return the pending amount to the user's balance
    // Calculate new balance by adding back the original trade amount plus any profit/loss
    const newBalance = accountData.balance + tradeData.amount;
    const newProfit =
      roundedProfit > 0
        ? (accountData.profit || 0) + roundedProfit
        : accountData.profit || 0;

    // Update the trade record
    const { error: updateError } = await supabase
      .from("trading_history")
      .update({
        profit_loss: roundedProfit,
        status: roundedProfit > 0 ? "profit" : "loss",
        closed_at: new Date().toISOString(),
      })
      .eq("id", tradeId);

    if (updateError) {
      throw updateError;
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
      closed_at: new Date().toISOString(),
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
      throw accountUpdateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Trade processed successfully",
        result: {
          tradeId: tradeId,
          profit_loss: roundedProfit,
          status: roundedProfit > 0 ? "profit" : "loss",
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
