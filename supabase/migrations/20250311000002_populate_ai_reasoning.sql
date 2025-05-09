-- Check if ai_reasoning column exists before attempting to update
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trading_history' 
    AND column_name = 'ai_reasoning'
  ) THEN
    -- Populate ai_reasoning column with mock data based on trade type and status
    UPDATE trading_history
    SET ai_reasoning = 
      CASE 
        WHEN trade_type = 'BUY' AND status = 'COMPLETED' AND profit_loss > 0 THEN 
          'Bullish momentum detected on ' || crypto_pair || ' with strong support levels. RSI indicated oversold conditions and MACD showed positive crossover.'
        WHEN trade_type = 'BUY' AND status = 'COMPLETED' AND profit_loss <= 0 THEN 
          'Expected bullish reversal on ' || crypto_pair || ' based on historical support levels, but market sentiment shifted unexpectedly.'
        WHEN trade_type = 'SELL' AND status = 'COMPLETED' AND profit_loss > 0 THEN 
          'Bearish divergence detected on ' || crypto_pair || ' with overbought conditions. Volume analysis indicated selling pressure.'
        WHEN trade_type = 'SELL' AND status = 'COMPLETED' AND profit_loss <= 0 THEN 
          'Predicted correction on ' || crypto_pair || ' based on resistance levels, but unexpected positive news caused price surge.'
        WHEN status = 'PENDING' THEN 
          'Analyzing ' || crypto_pair || ' market conditions. Entry identified based on key technical indicators and current market sentiment.'
        WHEN status = 'CANCELLED' THEN 
          'Trade cancelled due to sudden volatility spike in ' || crypto_pair || ' market. Risk parameters exceeded safety thresholds.'
        ELSE
          'Technical analysis of ' || crypto_pair || ' showed favorable risk-reward ratio based on current market conditions.'
      END
    WHERE (ai_reasoning IS NULL OR ai_reasoning = '') AND crypto_pair IS NOT NULL;
  END IF;
END
$$;