# CCXT Integration Guide

## Overview

CCXT (CryptoCurrency eXchange Trading) is a fully unified, mature, and actively maintained open-source library for interacting with cryptocurrency exchanges via REST APIs. It provides a unified interface across 100+ cryptocurrency exchanges.

**Website:** https://github.com/ccxt/ccxt  
**Documentation:** https://docs.ccxt.com

## Supported Exchanges via CCXT

The system now supports connection to any CCXT-compatible exchange:

### Major Exchanges (Tested & Optimized)
- **Binance** - World's largest exchange (125x leverage on futures)
- **Bybit** - Fast futures trading (100x leverage)
- **OKX** - Leading global platform (100x leverage)
- **Gate.io** - Safety-focused (100x leverage)
- **MEXC** - Low-fee trading (125x leverage)
- **KuCoin** - Community exchange (100x leverage)
- **Huobi** - Established platform (100x leverage)
- **BingX** - Advanced features (150x leverage)
- **Kraken** - Regulated US exchange (50x leverage)
- **Coinbase** - Beginner-friendly (spot only)

### Additional CCXT Support
CCXT supports 100+ additional exchanges. Full list: https://github.com/ccxt/ccxt#supported-cryptocurrency-exchange-markets

## Installation

### Node.js / JavaScript
```bash
npm install ccxt
# or
yarn add ccxt
```

### Python
```bash
pip install ccxt
```

## Connection Configuration

### API Credentials Required
1. **API Key** - Your exchange API key
2. **API Secret** - Your exchange API secret
3. **API Passphrase** (Optional) - Required by OKX, Bybit, and some others

### How to Get Credentials

#### Binance
1. Login to https://www.binance.com
2. Click Account → API Management
3. Create New Key → Generate → Copy key and secret

#### Bybit
1. Login to https://www.bybit.com
2. Go to Account → API
3. Create API Key → Copy key and secret

#### OKX
1. Login to https://www.okx.com
2. Go to Account → API
3. Create API Key → Copy key, secret, and passphrase

#### Gate.io
1. Login to https://www.gate.io
2. Settings → API Keys
3. Create API Key → Copy key and secret

## Library Types

### 1. Native SDK (Recommended for Primary Exchanges)
- Official exchange-specific implementation
- Fastest performance
- Maximum feature support
- Requires per-exchange setup

Example: `bybit-api`, `@binance/connector`, `okx-sdk`

### 2. CCXT (Universal Support)
- Works with 100+ exchanges
- Unified interface
- Easy exchange switching
- Slightly lower performance than native
- Perfect for multi-exchange strategies

### 3. Built-in Library
- Lightweight direct API connector
- No external dependencies
- Optimized for basic operations
- Limited exchange support

## Connection Methods

### 1. Library (Default)
- Direct API calls through native libraries
- Best performance
- Requires per-exchange implementation

### 2. REST API
- RESTful HTTP requests
- Slower but universal
- Rate limiting considerations

### 3. WebSocket
- Real-time data streaming
- Reduced latency
- Event-based updates
- Requires WebSocket support

## API Capabilities Detection

When testing a connection, the system automatically detects:

### Supported Features
- Unified account support
- Perpetual futures trading
- Spot trading
- Margin trading (cross/isolated)
- Hedge mode support
- Rate limiting specifications
- Available symbols/pairs
- Account balance information

### Trading Modes

#### Hedge Mode (Directional)
- Open simultaneous long AND short positions
- Separate position limit for each
- Higher capital efficiency
- Recommended for grid/bot trading

#### One-Way Mode
- Open either long OR short per symbol
- Simpler management
- Lower complexity
- Good for directional trading

## Testnet Support

Most exchanges offer testnet environments for testing:

```javascript
// Enable testnet in configuration
const config = {
  apiKey: 'your-testnet-key',
  apiSecret: 'your-testnet-secret',
  sandbox: true, // or testnet: true for some exchanges
};
```

### Testnet Endpoints
- **Binance Testnet:** https://testnet.binance.vision
- **Bybit Testnet:** https://api-testnet.bybit.com
- **OKX Testnet:** https://www.okx.com (sandbox mode)

## Security Considerations

### API Key Best Practices
1. **Create read-only keys** - Disable withdrawals and transfers
2. **IP Whitelist** - Restrict access to your server's IP
3. **Enable 2FA** - Two-factor authentication on account
4. **Separate keys** - Use different keys for different bots
5. **Rotate regularly** - Change keys periodically
6. **Never share** - Keep credentials confidential

### IP Whitelisting Example
```
Allowed IPs:
- Your server IP
- Your home/office IP (if accessing locally)
- Keep list minimal for security
```

## Connection Testing

The system includes comprehensive connection testing:

1. **Credentials Validation** - Verify API key/secret format
2. **Connectivity Test** - Check if exchange API is accessible
3. **Authentication Test** - Verify credentials are accepted
4. **Balance Query** - Fetch account balance (requires read-only permission)
5. **Capabilities Detection** - Identify supported features

### Test Results Include
- Account balance (in USDT)
- Available trading pairs
- Supported features
- Rate limits
- Connection latency
- Detailed error logs if failed

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid credentials | Verify API key/secret |
| 403 Forbidden | IP not whitelisted | Add IP to whitelist |
| Network timeout | Poor connection | Check network, retry |
| Invalid exchange | Unsupported exchange | Select supported exchange |
| Missing passphrase | Required field not provided | Add passphrase for OKX/Bybit |

## Supported Trading Pairs

Each exchange supports different trading pairs:

```javascript
// Common pairs available on most exchanges
- BTC/USDT (Bitcoin)
- ETH/USDT (Ethereum)  
- SOL/USDT (Solana)
- XRP/USDT (Ripple)
- ADA/USDT (Cardano)
- And 1000+ other pairs
```

## Rate Limiting

CCXT includes automatic rate limiting:

```javascript
// Default rate limiting prevents exchange bans
config: {
  enableRateLimit: true, // Built-in rate limiting
  timeout: 15000,        // 15 second timeout
}
```

## Advanced Configuration

### Custom Timeouts
```javascript
{
  timeout: 30000,  // 30 seconds (default: 15000)
  enableRateLimit: true,
}
```

### Sandbox/Testnet Mode
```javascript
{
  sandbox: true,  // Enable sandbox mode
  urls: {
    api: {
      public: 'https://testnet-url.example.com',
      private: 'https://testnet-url.example.com',
    }
  }
}
```

## Performance Optimization

1. **Use Native SDK** when available (faster than CCXT)
2. **Enable rate limiting** to prevent bans
3. **Batch requests** when possible
4. **Use WebSocket** for real-time data
5. **Cache responses** for stable data (symbols, markets)

## Troubleshooting

### Connection Failed
- Check internet connectivity
- Verify API credentials
- Check IP whitelisting
- Verify exchange status (https://status.exchange.com)

### Slow Performance
- Check network latency
- Consider Native SDK instead of CCXT
- Check exchange server status
- Reduce request frequency

### Authentication Issues
- Verify API key format
- Check passphrase requirement
- Ensure read-only mode is enabled
- Verify IP whitelisting is correct

## Additional Resources

- **CCXT Documentation:** https://docs.ccxt.com
- **CCXT GitHub:** https://github.com/ccxt/ccxt
- **CCXT Manual:** https://docs.ccxt.com/manual/
- **Supported Exchanges:** https://github.com/ccxt/ccxt#supported-cryptocurrency-exchange-markets

## Support

For CCXT-specific issues:
1. Check CCXT documentation: https://docs.ccxt.com
2. Visit CCXT GitHub: https://github.com/ccxt/ccxt
3. Check exchange API documentation

For integration issues:
1. Review connection test logs
2. Verify credentials and permissions
3. Check exchange API status
