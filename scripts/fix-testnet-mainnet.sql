-- Fix all BingX connections to use mainnet (is_testnet = false)
UPDATE exchange_connections 
SET is_testnet = false,
    updated_at = NOW()
WHERE exchange IN ('bingx', 'bybit', 'okx')
  AND is_testnet = true;

-- Verify the changes
SELECT id, name, exchange, is_testnet 
FROM exchange_connections 
WHERE exchange IN ('bingx', 'bybit', 'okx');
