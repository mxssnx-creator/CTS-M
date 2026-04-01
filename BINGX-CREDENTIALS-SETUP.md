# BingX Real Credentials Setup Guide

## Overview
The system now supports submitting real BingX API credentials for live trading on mainnet. This guide explains how to configure your BingX connection with real credentials.

## Step-by-Step Setup

### 1. Access the BingX Connection Settings
- Navigate to **Settings** → **Exchange Connections**
- Find the **BingX X01** connection in the list
- Click the **Edit** button or credential icon

### 2. Enter Your Real API Credentials
You can submit credentials in two ways:

#### Option A: Using the BingX Credentials Dialog
- Look for the "Configure BingX API Credentials" dialog
- Enter your real BingX API Key
- Enter your real BingX API Secret  
- (Optional) Enter your BingX API Passphrase if configured
- Click "Configure"

#### Option B: Direct Connection Edit
- Edit the BingX X01 connection directly
- Paste your real API Key
- Paste your real API Secret
- Ensure `is_testnet` is set to `false` (mainnet)
- Click "Test Connection" to verify
- Save the connection

### 3. Where to Get Your Credentials
1. Go to [BingX API Management](https://www.bingx.com/en/account/my-api)
2. Create or select an existing API key
3. Copy the API Key
4. Copy the API Secret
5. (Optional) Copy the API Passphrase if you set one

### 4. API Endpoints Used
- **Mainnet Only**: The system is configured to use BingX mainnet endpoints
- **Real Trading**: Once credentials are set, you can enable live trading
- **Perpetual Futures**: Default API type is perpetual futures trading

## API Endpoints

### Check BingX Credentials Status
```bash
GET /api/settings/connections/setup-bingx-real
```

Response:
```json
{
  "ready": true,
  "connection": {
    "id": "bingx-x01",
    "name": "BingX X01",
    "hasApiKey": true,
    "hasApiSecret": true,
    "apiKeyLength": 32,
    "apiSecretLength": 40,
    "isTestnet": false,
    "isEnabled": true
  }
}
```

### Submit Real BingX Credentials
```bash
POST /api/settings/connections/setup-bingx-real
Content-Type: application/json

{
  "apiKey": "your_real_api_key_here",
  "apiSecret": "your_real_api_secret_here",
  "apiPassphrase": "optional_passphrase"
}
```

Response:
```json
{
  "success": true,
  "message": "BingX connection updated with real credentials",
  "connection": {
    "id": "bingx-x01",
    "name": "BingX X01",
    "api_key_preview": "aBcDeFgH...XyZ",
    "api_secret_length": 40,
    "is_testnet": false,
    "updated_at": "2025-03-09T14:30:00Z"
  }
}
```

## Client-Side Helpers

The system provides TypeScript/JavaScript helpers for credential management:

```typescript
import { submitBingXCredentials, checkBingXCredentials } from "@/lib/bingx-credentials-helper"

// Check if BingX has valid credentials
const status = await checkBingXCredentials()
if (status.ready) {
  console.log("BingX is ready for trading")
}

// Submit real credentials
const result = await submitBingXCredentials(apiKey, apiSecret, apiPassphrase)
if (result.success) {
  console.log("Credentials saved successfully")
}
```

## Security Notes

- All credentials are transmitted over HTTPS
- API Keys and Secrets are stored securely in Redis
- Never share your API credentials with anyone
- Consider using API keys with restricted permissions for added security
- Regularly audit your API key usage on BingX

## Next Steps After Configuration

Once BingX credentials are configured:

1. **Enable Live Trading**: Toggle "Live Trade" in the connection settings
2. **Configure Position Limits**: Set max positions, leverage, and drawdown limits
3. **Start the Engine**: Click "Enable" to add connection to Active panel
4. **Monitor Trading**: Check the dashboard for active positions and trades

## Troubleshooting

### "API key and secret are required"
- Ensure both API Key and API Secret are entered
- Check that you copied the values correctly from BingX

### "API key and secret must be at least 20 characters"
- Your BingX API credentials might be incomplete
- Re-check that you copied the full values from BingX

### Connection test fails
- Verify your API Key and Secret are correct
- Check that your BingX account has the API enabled
- Ensure the API Key hasn't been disabled/revoked
- Check your network connection

### "BingX connection not found"
- Initialize connections first via Settings
- Try refreshing the page
- Contact support if the issue persists

## Support
For more information on BingX API:
- [BingX API Documentation](https://bingx-api.github.io/docs/)
- [BingX Account Management](https://www.bingx.com/en/account/my-api)
