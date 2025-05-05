import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthLayout() {
  const checkIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for pending trades when component mounts
    checkPendingTrades();

    // Set up an interval to check for pending trades that might have completed
    // Check every 10 seconds to ensure trades are processed promptly
    const pendingTradesInterval = setInterval(checkPendingTrades, 10000);
    checkIntervalRef.current = pendingTradesInterval as unknown as number;

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  async function checkPendingTrades() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get all pending trades
      const { data: pendingTrades, error } = await supabase
        .from("trading_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching pending trades:", error);
        return;
      }

      if (!pendingTrades || pendingTrades.length === 0) return;

      const now = new Date();

      // Check each pending trade to see if it should be completed
      for (const trade of pendingTrades) {
        const createdAt = new Date(trade.created_at);
        const durationMs = parseInt(trade.duration_minutes) * 60 * 1000;
        const shouldBeCompletedAt = new Date(createdAt.getTime() + durationMs);

        // If the trade should be completed by now but is still pending
        if (now >= shouldBeCompletedAt) {
          console.log(`Processing overdue pending trade: ${trade.id}`);

          try {
            // First try to process the trade using the edge function
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process_trade`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  tradeId: trade.id,
                  userId: user.id,
                }),
              },
            );

            if (!response.ok) {
              throw new Error(
                `Failed to process trade: ${response.statusText}`,
              );
            }

            console.log(
              `Successfully processed pending trade ${trade.id} via edge function`,
            );
          } catch (edgeFunctionError) {
            console.error(
              `Edge function error for trade ${trade.id}:`,
              edgeFunctionError,
            );
            console.log("Falling back to client-side processing...");

            // Process the trade using local logic as fallback
            try {
              // Get user's trading settings
              const { data: settingsData, error: settingsError } =
                await supabase
                  .from("trading_settings")
                  .select("*")
                  .eq("user_id", user.id)
                  .single();

              if (settingsError) {
                console.error(
                  "Error fetching trading settings:",
                  settingsError,
                );
                continue;
              }

              // Get user's account data
              const { data: accountData, error: accountError } = await supabase
                .from("user_accounts")
                .select("*")
                .eq("id", user.id)
                .single();

              if (accountError) {
                console.error("Error fetching account data:", accountError);
                continue;
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

              const profitAmount = (trade.amount * profitPercentage) / 100;
              const roundedProfit = Math.round(profitAmount * 100) / 100;

              // IMPORTANT: Return the pending amount to the user's balance
              // Calculate new balance by adding back the original trade amount plus any profit/loss
              const newBalance = accountData.balance + trade.amount;
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
                  closed_at: now.toISOString(),
                })
                .eq("id", trade.id);

              if (updateError) {
                console.error(`Failed to update trade: ${updateError.message}`);
                continue;
              }

              // Create a record in trades table
              const { error: tradeInsertError } = await supabase
                .from("trades")
                .insert({
                  user_id: user.id,
                  crypto_pair: trade.crypto_pair,
                  trade_type: trade.trade_type,
                  amount: trade.amount,
                  profit_loss: roundedProfit,
                  status: roundedProfit > 0 ? "profit" : "loss",
                  created_at: trade.created_at,
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
                .eq("id", user.id);

              if (accountUpdateError) {
                console.error(
                  `Failed to update account: ${accountUpdateError.message}`,
                );
                continue;
              }

              console.log(
                `Successfully processed pending trade ${trade.id} via client-side fallback`,
              );
            } catch (fallbackError) {
              console.error(
                `Error in client-side fallback for trade ${trade.id}:`,
                fallbackError,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking pending trades:", error);
    }
  }

  return <Outlet />;
}
