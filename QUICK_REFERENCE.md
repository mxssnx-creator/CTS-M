# Dashboard Modernization - Quick Reference Guide

## Component Quick Links

| Component | File | Purpose | Use Case |
|-----------|------|---------|----------|
| **VolumeConfigurationPanel** | `volume-configuration-panel.tsx` | Volume factor & order type config | Connection card, settings dialogs |
| **OrderSettingsPanel** | `order-settings-panel.tsx` | Market/Limit order settings | Order configuration, trading modes |
| **SymbolSettingsCard** | `symbol-settings-card.tsx` | Symbol management UI | Dashboard, symbol selection |
| **IndicationsConfigCard** | `indications-config-card.tsx` | Indicator setup (20+ indicators) | Strategy configuration, dashboard |
| **StrategiesConfigCard** | `strategies-config-card.tsx` | Strategy setup (15+ strategies) | Trading modes, settings |
| **MainTradeCard** | `main-trade-card.tsx` | Main trade configuration | Connection cards, trading dashboard |
| **PresetTradeCard** | `preset-trade-card.tsx` | Preset trading management | Connection cards, preset selection |

## Common Imports

```typescript
// Import all components
import {
  VolumeConfigurationPanel,
  OrderSettingsPanel,
  SymbolSettingsCard,
  IndicationsConfigCard,
  StrategiesConfigCard,
  MainTradeCard,
  PresetTradeCard,
} from '@/components/dashboard'

// Or import individually
import { VolumeConfigurationPanel } from '@/components/dashboard/volume-configuration-panel'
```

## Quick Implementation Snippets

### Volume Configuration
```typescript
const [liveVolume, setLiveVolume] = useState(1.0)
const [presetVolume, setPresetVolume] = useState(1.0)
const [orderType, setOrderType] = useState<'market' | 'limit'>('market')

<VolumeConfigurationPanel
  liveVolumeFactor={liveVolume}
  presetVolumeFactor={presetVolume}
  onLiveVolumeChange={setLiveVolume}
  onPresetVolumeChange={setPresetVolume}
  orderType={orderType}
  onOrderTypeChange={setOrderType}
  volumeType="usdt"
  onVolumeTypeChange={() => {}}
/>
```

### Symbol Management
```typescript
const [symbols, setSymbols] = useState([
  {
    id: 'btc',
    symbol: 'BTC/USDT',
    price: 45000,
    change24h: 2.5,
    volume24h: 25000000000,
    isFavorite: true,
    isActive: true,
    lastTradeTime: new Date().toISOString(),
  },
])

<SymbolSettingsCard
  symbols={symbols}
  onAddSymbol={(sym) => console.log('Add:', sym)}
  onRemoveSymbol={(id) => console.log('Remove:', id)}
  onToggleFavorite={(id) => console.log('Favorite:', id)}
  onToggleActive={(id) => console.log('Active:', id)}
/>
```

### Indications Configuration
```typescript
const [indications, setIndications] = useState([])

<IndicationsConfigCard
  indications={indications}
  onToggleIndication={(id) => {}}
  onUpdateParameters={(id, params) => {}}
  onResetIndication={(id) => {}}
/>
```

### Main Trade Card
```typescript
const [mainTradeStatus, setMainTradeStatus] = useState('idle')

<MainTradeCard
  config={mainTradeConfig}
  onStatusChange={setMainTradeStatus}
  onConfigUpdate={(config) => {
    console.log('Updated config:', config)
  }}
/>
```

### Preset Trade Card
```typescript
const [presetStatus, setPresetStatus] = useState('idle')
const [activePreset, setActivePreset] = useState('preset-1')

<PresetTradeCard
  config={presetTradeConfig}
  onStatusChange={setPresetStatus}
  onPresetChange={setActivePreset}
  onConfigUpdate={(config) => {}}
  onTestPreset={() => console.log('Testing preset...')}
/>
```

## Component Props Overview

### VolumeConfigurationPanel
```typescript
interface Props {
  liveVolumeFactor: number
  presetVolumeFactor: number
  onLiveVolumeChange: (value: number) => void
  onPresetVolumeChange: (value: number) => void
  orderType: "market" | "limit"
  onOrderTypeChange: (type: "market" | "limit") => void
  volumeType: "usdt" | "contract"
  onVolumeTypeChange: (type: "usdt" | "contract") => void
}
```

### SymbolSettingsCard
```typescript
interface Props {
  symbols: Symbol[]
  onAddSymbol?: (symbol: string) => void
  onRemoveSymbol?: (symbolId: string) => void
  onToggleFavorite?: (symbolId: string) => void
  onToggleActive?: (symbolId: string) => void
}
```

### MainTradeCard
```typescript
interface Props {
  config: MainTradeConfig
  onStatusChange?: (status: "idle" | "active" | "paused" | "stopped") => void
  onConfigUpdate?: (config: Partial<MainTradeConfig>) => void
}
```

### PresetTradeCard
```typescript
interface Props {
  config: PresetTradeConfig
  onStatusChange?: (status: "idle" | "active" | "paused" | "stopped") => void
  onPresetChange?: (presetId: string) => void
  onConfigUpdate?: (config: Partial<PresetTradeConfig>) => void
  onTestPreset?: () => void
}
```

## Styling & Theming

All components use Shadcn/UI and Tailwind CSS:

```typescript
// Custom styling example
<div className="space-y-4">
  <VolumeConfigurationPanel {...props} />
  {/* 'space-y-4' adds consistent vertical spacing */}
</div>
```

## Common Patterns

### Form Submission
```typescript
const handleSaveSettings = async () => {
  const response = await fetch('/api/settings/volume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      liveVolume,
      presetVolume,
      orderType,
    }),
  })
  if (response.ok) {
    toast.success('Settings saved')
  }
}
```

### Status Updates
```typescript
const handleStatusChange = async (status: string) => {
  setMainTradeStatus(status)
  
  // Call engine API
  await fetch('/api/trade-engine/status', {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}
```

### Real-time Statistics
```typescript
// Poll for updates every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const stats = await fetch('/api/trade-stats')
    const data = await stats.json()
    setStatistics(data)
  }, 2000)
  
  return () => clearInterval(interval)
}, [])
```

## Indicator Categories Cheat Sheet

### Direction Indications (Trend Detection)
- **RSI** - Relative Strength Index (Overbought/Oversold)
- **MACD** - Moving Average Convergence (Momentum)
- **Stochastic** - Stochastic Oscillator (Trend reversal)
- **ADX** - Average Directional Index (Trend strength)

### Movement Indications (Volatility/Range)
- **ATR** - Average True Range (Volatility measure)
- **BB** - Bollinger Bands (Range/Breakout)
- **KC** - Keltner Channels (Volatility bands)
- **VP** - Volume Profile (Price distribution)

### Active/Custom Indications
- Custom user-defined indicators
- Webhook-based external signals
- ML model predictions

### Optimal Indicators
- Auto-tuned to current market
- Performance-based selection
- Backtest-validated

### Advanced Analysis
- Multi-timeframe correlation
- Correlation matrices
- Advanced filtering logic

## Strategy Categories Cheat Sheet

### Base Strategies (Foundation)
- **Trailing** - Follow price movements
- **Block** - Fixed position blocks
- **DCA** - Dollar Cost Averaging

### Main Trade Strategies
- **Momentum** - Trend following
- **Reversal** - Counter-trend
- **Support/Resistance** - Level-based
- **Trend Following** - Trend confirmation

### Preset Trade Strategies
- **Auto-Optimal** - Auto-tuned
- **Coordination** - Multi-symbol
- **Risk-Adjusted** - Risk management
- **Portfolio** - Portfolio rebalancing

### Advanced Strategies
- **Hedging** - Risk mitigation
- **Arbitrage** - Opportunity detection

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between form inputs |
| `Enter` | Submit/Confirm action |
| `Escape` | Close dialog/collapsible |
| `Space` | Toggle switch/checkbox |

## Responsive Breakpoints

```typescript
// Tailwind classes used
// sm: 640px (tablets)
// md: 768px (small laptops)
// lg: 1024px (desktop)
// xl: 1280px (large screens)

// Example: Two columns on desktop, one on mobile
<div className="grid grid-cols-1 md:grid-cols-2">
  {/* Content */}
</div>
```

## Error Handling

```typescript
try {
  await updateSettings(config)
  toast.success('Settings updated successfully')
} catch (error) {
  toast.error(`Failed to update: ${error.message}`)
  console.error('Update error:', error)
}
```

## Performance Tips

1. **Memoize callbacks** for child components
```typescript
const handleVolumeChange = useCallback((value) => {
  setLiveVolume(value)
}, [])
```

2. **Use state selectively** - Only re-render when needed
3. **Lazy load** expansible sections
4. **Virtualize long lists** for symbol/indicator lists
5. **Debounce** slider changes for expensive operations

## Debugging

```typescript
// Enable debug logging
const DEBUG = true

if (DEBUG) {
  console.log('[v0] Component mounted:', { props, state })
}

// Check component state
console.log('Main trade status:', mainTradeStatus)
console.log('Volume factors:', { liveVolume, presetVolume })
```

## API Integration Checklist

- [ ] Volume settings endpoint `/api/settings/volume`
- [ ] Order settings endpoint `/api/settings/orders`
- [ ] Symbol list endpoint `/api/symbols`
- [ ] Indicators config endpoint `/api/indicators`
- [ ] Strategies config endpoint `/api/strategies`
- [ ] Trade engine status endpoint `/api/trade-engine/status`
- [ ] Preset switching endpoint `/api/presets/switch`
- [ ] Statistics polling endpoint `/api/trade-stats`

## Resources

- **Documentation:** `DASHBOARD_MODERNIZATION.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Shadcn/UI:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Lucide Icons:** https://lucide.dev/

## Support

For issues or questions:
1. Check the main documentation files
2. Review component JSDoc comments
3. Check the implementation examples
4. Review existing usage in `active-connection-card.tsx`
