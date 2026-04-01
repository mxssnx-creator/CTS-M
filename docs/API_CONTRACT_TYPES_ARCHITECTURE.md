# API Contract Types Architecture

## Critical Distinction: Contract Types vs Account Types

### Contract Types (Trading Section Variables)
Contract types define **WHAT you trade** and are **independent variables** that affect:
- API base URLs (different domains for spot vs futures)
- API endpoints (different paths for different contract types)
- Market data structure
- Order execution logic

**Available Contract Types:**
- `spot` - Spot trading (immediate settlement, no leverage)
- `perpetual_futures` - Perpetual futures/swaps (never expire, funding rates)
- `futures` - Dated futures contracts (expire at settlement)
- `unified` - Bybit-specific: unified account trading all types

### Account Types (Wallet Organization)
Account types define **HOW the exchange organizes wallets** (exchange-specific):
- `UNIFIED` (Bybit) - Single wallet for all contract types
- `CONTRACT` (Bybit) - Derivatives/futures-only wallet
- `SPOT` (Bybit) - Spot-only wallet

## Exchange-Specific Implementation

### Bybit (API V5)
- **Base URL:** Same for all types (`api.bybit.com`)
- **Account Type Parameter:** Uses `accountType` query parameter
  - `spot` contract → `SPOT` accountType
  - `perpetual_futures` contract → `CONTRACT` accountType  
  - `unified` contract → `UNIFIED` accountType
- **Endpoint:** `/v5/account/wallet-balance?accountType={UNIFIED|CONTRACT|SPOT}`
- **Documentation:** https://bybit-exchange.github.io/docs/v5/intro

### Binance
- **Base URLs:** DIFFERENT domains for each contract type
  - Spot: `api.binance.com` (testnet: `testnet.binance.vision`)
  - Futures: `fapi.binance.com` (testnet: `testnet.binancefuture.com`)
- **Endpoints:**
  - Spot: `/api/v3/account`
  - Futures: `/fapi/v2/balance`
- **Response Format:** Different for each type
  - Spot: `{balances: [{asset, free, locked}]}`
  - Futures: `[{asset, balance, availableBalance}]`
- **Documentation:** https://developers.binance.com/

### BingX
- **Base URL:** Same for all types (`open-api.bingx.com`)
- **Endpoints:** DIFFERENT paths for each contract type
  - Spot: `/openApi/spot/v1/account/balance`
  - Perpetual: `/openApi/swap/v3/user/balance`
- **Documentation:** https://bingx-api.github.io/docs

### OKX
- **Base URL:** Same for all types (`www.okx.com`)
- **Unified API:** Single endpoint handles all account types
- **Endpoint:** `/api/v5/account/balance`

## Data Flow

```
User Selects Contract Type in Settings
  ↓
apiType stored in connection config
  ↓
Test/Trade Request
  ↓
Connector receives apiType parameter
  ↓
Exchange-Specific Logic:
  - Bybit: Map to accountType parameter
  - Binance: Route to correct base URL
  - BingX: Route to correct endpoint path
  - OKX: Use unified endpoint
  ↓
API Request with Correct Configuration
  ↓
Response parsed according to contract type
```

## Configuration Fields

### Connection Settings
- `api_type` (contract type): `spot` | `perpetual_futures` | `futures` | `unified`
- `api_subtype` (only for unified): `spot` | `perpetual` | `derivatives`
- `margin_type`: `cross` | `isolated`
- `position_mode`: `one-way` | `hedge`

### Rules
1. **api_type is ALWAYS required** - defines the trading section
2. **api_subtype is ONLY used when api_type === "unified"**
3. **Contract types are independent from margin/position settings**
4. **Each exchange maps contract types to their own internal structure**

## Testing Checklist
- [ ] Spot trading connects to spot endpoints
- [ ] Perpetual futures connects to futures endpoints
- [ ] Balance reflects correct wallet for selected contract type
- [ ] No cross-contamination between contract types
- [ ] Logs show correct URL/endpoint being used
- [ ] Response parsing matches contract type

## Common Issues

### Issue: Getting perpetual data when spot is selected
**Cause:** Connector using hardcoded endpoint instead of apiType-based routing
**Fix:** Check `getBaseUrl()` and endpoint selection logic

### Issue: API returns "invalid account type"
**Cause:** Mismatch between contract type and account type mapping
**Fix:** Verify `getEffectiveAccountType()` mapping for the exchange

### Issue: Wrong balance showing
**Cause:** Querying wrong wallet/account type
**Fix:** Ensure contract type correctly maps to exchange's wallet structure
