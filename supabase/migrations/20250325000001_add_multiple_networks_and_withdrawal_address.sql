ALTER TABLE wallet_settings ADD COLUMN IF NOT EXISTS trc20_address TEXT;
ALTER TABLE wallet_settings ADD COLUMN IF NOT EXISTS bep20_address TEXT;
ALTER TABLE wallet_settings ADD COLUMN IF NOT EXISTS erc20_address TEXT;

UPDATE wallet_settings SET 
  trc20_address = COALESCE(wallet_address, 'TRC20WalletAddressDefault123456789'),
  bep20_address = '0xBEP20WalletAddressDefault123456789',
  erc20_address = '0xERC20WalletAddressDefault123456789'
WHERE trc20_address IS NULL OR bep20_address IS NULL OR erc20_address IS NULL;

ALTER TABLE deposits ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'trc20';
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS wallet_address TEXT;

ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS withdrawal_address TEXT;