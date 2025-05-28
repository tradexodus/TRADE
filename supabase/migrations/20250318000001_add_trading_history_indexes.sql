-- Add indexes to improve performance of pending trade lookups
CREATE INDEX IF NOT EXISTS idx_trading_history_status ON trading_history(status);
CREATE INDEX IF NOT EXISTS idx_trading_history_user_status ON trading_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_history_expiration ON trading_history(expiration_time);

-- Add a function to process expired trades more efficiently
CREATE OR REPLACE FUNCTION process_expired_trades() RETURNS void AS $$
DECLARE
  trade_record RECORD;
  is_win BOOLEAN;
  profit_percentage NUMERIC;
  profit_amount NUMERIC;
  rounded_profit NUMERIC;
  settings_record RECORD;
  account_record RECORD;
  new_balance NUMERIC;
  new_profit NUMERIC;
BEGIN
  -- Loop through all pending trades that have expired
  FOR trade_record IN 
    SELECT * FROM trading_history 
    WHERE status = 'pending' 
    AND (
      (expiration_time IS NOT NULL AND expiration_time <= NOW()) OR
      (created_at IS NOT NULL AND duration_minutes IS NOT NULL AND 
       created_at + (duration_minutes || ' minutes')::interval <= NOW())
    )
  LOOP
    -- Get user's trading settings or use defaults
    BEGIN
      SELECT * INTO settings_record FROM trading_settings WHERE user_id = trade_record.user_id;
      
      -- If no settings found, use defaults
      IF NOT FOUND THEN
        settings_record := ROW(NULL, NULL, 0.65, 1.5, 0.8, 0.95, NULL, NULL);
      END IF;
      
      -- Get user's account data
      SELECT * INTO account_record FROM user_accounts WHERE id = trade_record.user_id;
      
      -- Determine if the trade is a win or loss based on probability
      is_win := random() < settings_record.win_probability;
      
      -- Calculate profit or loss
      IF is_win THEN
        -- Generate profit between min and max profit percentage
        profit_percentage := settings_record.min_profit_percentage + 
                            random() * (settings_record.max_profit_percentage - settings_record.min_profit_percentage);
      ELSE
        -- Generate loss up to max loss percentage (negative value)
        profit_percentage := -1 * (random() * settings_record.max_loss_percentage);
      END IF;
      
      profit_amount := (trade_record.amount * profit_percentage) / 100;
      rounded_profit := round(profit_amount * 100) / 100;
      
      -- Update the trade record
      UPDATE trading_history
      SET 
        profit_loss = rounded_profit,
        status = CASE WHEN rounded_profit > 0 THEN 'profit' ELSE 'loss' END,
        closed_at = NOW()
      WHERE id = trade_record.id;
      
      -- Update account balance and profit
      new_balance := account_record.balance + trade_record.amount;
      
      IF rounded_profit > 0 THEN
        new_profit := COALESCE(account_record.profit, 0) + rounded_profit;
      ELSE
        new_balance := new_balance + rounded_profit;
        new_profit := COALESCE(account_record.profit, 0);
      END IF;
      
      UPDATE user_accounts
      SET 
        balance = new_balance,
        profit = new_profit
      WHERE id = trade_record.user_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next trade
      RAISE NOTICE 'Error processing trade %: %', trade_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
