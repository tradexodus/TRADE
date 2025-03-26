CREATE TABLE IF NOT EXISTS trading_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  win_probability NUMERIC NOT NULL DEFAULT 0.7,
  max_profit_percentage NUMERIC NOT NULL DEFAULT 15,
  min_profit_percentage NUMERIC NOT NULL DEFAULT 5,
  max_loss_percentage NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_user_trading_settings(p_user_id UUID)
RETURNS TABLE (
  win_probability NUMERIC,
  max_profit_percentage NUMERIC,
  max_loss_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT ts.win_probability, ts.max_profit_percentage, ts.max_loss_percentage
  FROM trading_settings ts
  WHERE ts.user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Return default values if no settings found
    RETURN QUERY SELECT 0.7::NUMERIC, 15::NUMERIC, 5::NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql;

alter publication supabase_realtime add table trading_settings;