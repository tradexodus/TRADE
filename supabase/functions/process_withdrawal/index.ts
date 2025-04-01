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
    const { withdrawalId, action } = await req.json();

    if (!withdrawalId) {
      throw new Error("Missing withdrawal ID");
    }

    if (action === "approve") {
      // Get withdrawal details first
      const { data: withdrawalData, error: fetchError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Check if withdrawal is already processed
      if (withdrawalData.status === "approved") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Withdrawal already approved",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          },
        );
      }

      // Update user account balance
      const { data: userData, error: userError } = await supabase
        .from("user_accounts")
        .select("balance, profit")
        .eq("id", withdrawalData.user_id)
        .single();

      if (userError) {
        throw userError;
      }

      // Calculate new balances
      const newBalance = userData.balance - withdrawalData.from_balance;
      const newProfit = userData.profit - withdrawalData.from_profit;

      // Update user account with new balances
      const { error: updateError } = await supabase
        .from("user_accounts")
        .update({
          balance: newBalance,
          profit: newProfit,
        })
        .eq("id", withdrawalData.user_id);

      if (updateError) {
        throw updateError;
      }

      // Update withdrawal status
      const { error: withdrawalUpdateError } = await supabase
        .from("withdrawals")
        .update({ status: "approved" })
        .eq("id", withdrawalId);

      if (withdrawalUpdateError) {
        throw withdrawalUpdateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Withdrawal processed successfully",
          result: withdrawalData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else if (action === "reject") {
      // Reject the withdrawal
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("id", withdrawalId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Withdrawal rejected successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else if (action === "check_status_change") {
      // This action is triggered by a webhook when withdrawal status changes
      const { data: withdrawalData, error: fetchError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // If status is approved, process the withdrawal
      if (withdrawalData.status === "approved") {
        // Update user account balance
        const { data: userData, error: userError } = await supabase
          .from("user_accounts")
          .select("balance, profit")
          .eq("id", withdrawalData.user_id)
          .single();

        if (userError) {
          throw userError;
        }

        // Calculate new balances
        const newBalance = userData.balance - withdrawalData.from_balance;
        const newProfit = userData.profit - withdrawalData.from_profit;

        // Update user account with new balances
        const { error: updateError } = await supabase
          .from("user_accounts")
          .update({
            balance: newBalance,
            profit: newProfit,
          })
          .eq("id", withdrawalData.user_id);

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Withdrawal funds deducted successfully",
            result: withdrawalData,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Withdrawal status checked",
          status: withdrawalData.status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else {
      throw new Error(
        "Invalid action. Use 'approve', 'reject', or 'check_status_change'",
      );
    }
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
