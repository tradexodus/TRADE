-- Create a function to process pending trades that have expired
CREATE OR REPLACE FUNCTION process_expired_trades()
RETURNS void AS $$
DECLARE
  trade_record RECORD;
  settings_record RECORD;
  profit_percentage FLOAT;
  profit_amount FLOAT;
  rounded_profit FLOAT;
  new_balance FLOAT;
  new_profit FLOAT;
BEGIN
  -- Find all pending trades that have passed their duration
  FOR trade_record IN 
    SELECT th.*, 
           EXTRACT(EPOCH FROM (NOW() - th.created_at))/60 AS elapsed_minutes,
           (th.duration_minutes)::float AS duration_minutes_float
    FROM trading_history th
    WHERE th.status = 'pending'
    AND EXTRACT(EPOCH FROM (NOW() - th.created_at))/60 >= (th.duration_minutes)::float
  LOOP
    -- Get user's trading settings
    SELECT * INTO settings_record 
    FROM trading_settings ts
    WHERE ts.user_id = trade_record.user_id;
    
    IF NOT FOUND THEN
      -- Use default settings if not found
      settings_record.win_probability := 0.7;
      settings_record.max_profit_percentage := 15;
      settings_record.min_profit_percentage := 5;
      settings_record.max_loss_percentage := 5;
    END IF;
    
    -- Determine win/loss using the win probability
    IF random() < settings_record.win_probability THEN
      -- Win: Calculate profit between min and max
      profit_percentage := settings_record.min_profit_percentage + 
                          random() * (settings_record.max_profit_percentage - settings_record.min_profit_percentage);
    ELSE
      -- Loss: Calculate loss up to max loss percentage (negative)
      profit_percentage := -1 * (random() * settings_record.max_loss_percentage);
    END IF;
    
    -- Calculate profit amount
    profit_amount := (trade_record.amount * profit_percentage) / 100;
    rounded_profit := round(profit_amount * 100) / 100;
    
    -- Update the trade record
    UPDATE trading_history
    SET profit_loss = rounded_profit,
        status = CASE WHEN rounded_profit > 0 THEN 'profit' ELSE 'loss' END,
        closed_at = NOW()
    WHERE id = trade_record.id;
    
    -- Create a record in trades table
    INSERT INTO trades (
      user_id, crypto_pair, trade_type, amount, profit_loss, status, created_at, closed_at
    ) VALUES (
      trade_record.user_id,
      trade_record.crypto_pair,
      trade_record.trade_type,
      trade_record.amount,
      rounded_profit,
      CASE WHEN rounded_profit > 0 THEN 'profit' ELSE 'loss' END,
      trade_record.created_at,
      NOW()
    );
    
    -- Update user's account balance and profit
    SELECT balance, profit INTO new_balance, new_profit
    FROM user_accounts
    WHERE id = trade_record.user_id;
    
    -- Always return the initial investment
    new_balance := new_balance + trade_record.amount;
    
    -- Only add to profit if it's positive
    IF rounded_profit > 0 THEN
      new_profit := new_profit + rounded_profit;
    END IF;
    
    UPDATE user_accounts
    SET balance = new_balance,
        profit = new_profit
    WHERE id = trade_record.user_id;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;
