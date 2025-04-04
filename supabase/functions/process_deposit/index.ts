import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
// Define neuron levels directly in this file to avoid import issues
interface NeuronLevel {
  name: string;
  minAmount: number;
  maxAmount: number | null;
  percentage: number;
  color: string;
  bgColor: string;
  icon: string;
}

const NEURON_LEVELS: NeuronLevel[] = [
  {
    name: "Beginner",
    minAmount: 0,
    maxAmount: 200,
    percentage: 2.5,
    color: "#3B82F6",
    bgColor: "#1E3A8A",
    icon: "Brain",
  },
  {
    name: "Intermediate",
    minAmount: 201,
    maxAmount: 1000,
    percentage: 3,
    color: "#10B981",
    bgColor: "#064E3B",
    icon: "Zap",
  },
  {
    name: "Advanced",
    minAmount: 1001,
    maxAmount: 5000,
    percentage: 4,
    color: "#6366F1",
    bgColor: "#312E81",
    icon: "Rocket",
  },
  {
    name: "Pro",
    minAmount: 5001,
    maxAmount: 10000,
    percentage: 5,
    color: "#EC4899",
    bgColor: "#831843",
    icon: "Star",
  },
  {
    name: "VIP",
    minAmount: 10001,
    maxAmount: 50000,
    percentage: 7,
    color: "#F59E0B",
    bgColor: "#78350F",
    icon: "Crown",
  },
  {
    name: "Elite",
    minAmount: 50001,
    maxAmount: null,
    percentage: 13.4,
    color: "#EF4444",
    bgColor: "#7F1D1D",
    icon: "Diamond",
  },
];

function getNeuronLevel(totalDepositAmount: number): NeuronLevel {
  let currentLevel: NeuronLevel | null = null;

  for (let i = 0; i < NEURON_LEVELS.length; i++) {
    const level = NEURON_LEVELS[i];

    if (
      totalDepositAmount >= level.minAmount &&
      (level.maxAmount === null || totalDepositAmount <= level.maxAmount)
    ) {
      currentLevel = { ...level };
      break;
    }
  }

  // Default to beginner if no level found (shouldn't happen with proper ranges)
  if (!currentLevel) {
    currentLevel = { ...NEURON_LEVELS[0] };
  }

  return currentLevel;
}

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
    const { depositId, action } = await req.json();

    if (!depositId) {
      throw new Error("Missing deposit ID");
    }

    if (action === "approve") {
      // Get deposit details first
      const { data: depositData, error: fetchError } = await supabase
        .from("deposits")
        .select("*")
        .eq("id", depositId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Check if deposit is already processed
      if (depositData.status === "approved") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Deposit already approved",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          },
        );
      }

      // Get user profile to update total deposit amount
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("total_deposit_amount")
        .eq("id", depositData.user_id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Calculate new total deposit amount
      const currentTotalDeposit = userProfile?.total_deposit_amount || 0;
      const newTotalDeposit = currentTotalDeposit + depositData.amount;

      // Get user account to update balance
      const { data: userData, error: userError } = await supabase
        .from("user_accounts")
        .select("balance")
        .eq("id", depositData.user_id)
        .single();

      if (userError) {
        throw userError;
      }

      // Calculate new balance
      const newBalance = (userData.balance || 0) + depositData.amount;

      // Update user account with new balance
      const { error: updateAccountError } = await supabase
        .from("user_accounts")
        .update({
          balance: newBalance,
        })
        .eq("id", depositData.user_id);

      if (updateAccountError) {
        throw updateAccountError;
      }

      // Determine new neuron level based on total deposit
      const neuronLevel = getNeuronLevel(newTotalDeposit);

      // Update user profile with new total deposit amount and neuron level
      const { error: updateProfileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: depositData.user_id,
          total_deposit_amount: newTotalDeposit,
          neuron_level: neuronLevel.name,
          neuron_level_percentage: neuronLevel.percentage,
        });

      if (updateProfileError) {
        throw updateProfileError;
      }

      // Update deposit status
      const { error: depositUpdateError } = await supabase
        .from("deposits")
        .update({ status: "approved" })
        .eq("id", depositId);

      if (depositUpdateError) {
        throw depositUpdateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Deposit approved successfully",
          result: depositData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else if (action === "reject") {
      // Reject the deposit
      const { error } = await supabase
        .from("deposits")
        .update({ status: "rejected" })
        .eq("id", depositId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Deposit rejected successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else {
      throw new Error("Invalid action. Use 'approve' or 'reject'");
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
