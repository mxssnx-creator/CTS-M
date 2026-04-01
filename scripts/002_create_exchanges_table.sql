-- Create exchanges table to store supported exchange information
CREATE TABLE IF NOT EXISTS exchanges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  supports_spot BOOLEAN DEFAULT true,
  supports_futures BOOLEAN DEFAULT false,
  supports_margin BOOLEAN DEFAULT false,
  api_endpoint VARCHAR(255),
  websocket_endpoint VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert all supported exchanges including bybit, bingx, pionex, orangex, okx
INSERT INTO exchanges (name, display_name, supports_spot, supports_futures, api_endpoint, websocket_endpoint) 
VALUES 
  ('binance', 'Binance', true, true, 'https://api.binance.com', 'wss://stream.binance.com:9443'),
  ('bybit', 'Bybit', true, true, 'https://api.bybit.com', 'wss://stream.bybit.com'),
  ('bingx', 'BingX', true, true, 'https://open-api.bingx.com', 'wss://open-api-swap.bingx.com'),
  ('pionex', 'Pionex', true, true, 'https://api.pionex.com', 'wss://ws.pionex.com'),
  ('orangex', 'OrangeX', true, true, 'https://api.orangex.com', 'wss://ws.orangex.com'),
  ('okx', 'OKX', true, true, 'https://www.okx.com', 'wss://ws.okx.com:8443'),
  ('coinbase', 'Coinbase Pro', true, false, 'https://api.pro.coinbase.com', 'wss://ws-feed.pro.coinbase.com'),
  ('kraken', 'Kraken', true, true, 'https://api.kraken.com', 'wss://ws.kraken.com')
ON CONFLICT (name) DO NOTHING;
