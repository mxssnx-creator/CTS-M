# Main Page Layout Overview & Visual Guide

## Complete Main Page Layout Structure

```
┌─ Main Page ────────────────────────────────────────────────┐
│                                                                      │
│  ┌─ Global Coordinator Status ──────────────────────────────────┐   │
│  │ ✓ Status: Running/Paused/Stopped                             │   │
│  │ Status details & quick action buttons                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─ System Overview Cards (Smart Cards) ──────────────────────────┐ │
│  │ • Total P&L | Active Symbols | Win Rate | Daily Drawdown      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ Global Trade Engine Controls ────────────────────────────────┐  │
│  │ [Start] [Pause] [Resume] [Stop] [Status Bar]                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Active Connections ──────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  ┌─ Connection Card 1 (Binance) ──────────────────────────┐  │  │
│  │  │                                                        │  │  │
│  │  │  • Wifi  Binance Connection | Live | Ready | ⚙ Logs  │  │  │
│  │  │  • API: REST | Margin: Cross | Live ✓ | Last: 14:32  │  │  │
│  │  │  • ☑ Enable  |  ☑ Live Trade  |  ☐ Preset Mode  | 🗑  │  │
│  │  │                                                        │  │  │
│  │  │  [Progress Bar when starting...]                      │  │  │
│  │  │                                                        │  │  │
│  │  │  ▼ EXPANDED SECTION ▼                                 │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌─ Volume Configuration ───────────────────────────┐  │  │  │
│  │  │  │ Live Trade Volume Factor: [═════●═════] 1.0x    │  │  │  │
│  │  │  │ [0.5x] [1.0x] [1.5x] [2.0x]                    │  │  │  │
│  │  │  │                                                  │  │  │  │
│  │  │  │ Preset Trade Volume Factor: [═════●═════] 1.5x  │  │  │  │
│  │  │  │ [0.5x] [1.0x] [1.5x] [2.0x]                    │  │  │  │
│  │  │  │                                                  │  │  │  │
│  │  │  │ Order Type: [Market ▼] | Volume Type: [USDT ▼]│  │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌─ Market Order Settings ──────────────────────────┐  │  │  │
│  │  │  │ Slippage Tolerance: [══●═══] 1.0%              │  │  │  │
│  │  │  │ Auto-Execution: ☑ Enabled                       │  │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌─ Main Trade ────────────────────────────────────┐   │  │  │
│  │  │  │ 🟢 Main Trade | Live (3 positions) | ▼ Expand │   │  │  │
│  │  │  │                                                 │   │  │  │
│  │  │  │ ▼ EXPANDED:                                     │   │  │  │
│  │  │  │ ┌─ Statistics ─────────────────────────────────┐│   │  │  │
│  │  │  │ │ P&L: +$1,245.50 (+2.45%)                   ││   │  │  │
│  │  │  │ │ Win Rate: 65% (3 wins)                     ││   │  │  │
│  │  │  │ │ Max Drawdown: -1.2% (Daily)                ││   │  │  │
│  │  │  │ │ Active: 3 Positions                        ││   │  │  │
│  │  │  │ └────────────────────────────────────────────┘│   │  │  │
│  │  │  │ ┌─ Engine Controls ────────────────────────────┐│   │  │  │
│  │  │  │ │ [▶ Start] [⏸ Pause] [↻ Resume] [■ Stop]    ││   │  │  │
│  │  │  │ └────────────────────────────────────────────┘│   │  │  │
│  │  │  │ ┌─ Configuration ──────────────────────────────┐│   │  │  │
│  │  │  │ │ Entry | Exit | Management                   ││   │  │  │
│  │  │  │ │                                              ││   │  │  │
│  │  │  │ │ Entry Settings:                              ││   │  │  │
│  │  │  │ │ • Indication-Based Entry: ☑ On              ││   │  │  │
│  │  │  │ │ • Confirmations Required: [══●══] 2 signals ││   │  │  │
│  │  │  │ │ • Size Calculation: [Fixed] [Percentage] [Dynamic]││  │  │
│  │  │  │ │                                              ││   │  │  │
│  │  │  │ │ Exit Settings:                               ││   │  │  │
│  │  │  │ │ • Take Profit: [════●════] 5.0%             ││   │  │  │
│  │  │  │ │ • Stop Loss: [═══●═══] 2.0%                ││   │  │  │
│  │  │  │ │ • Trailing Stop: ☐ Enable                   ││   │  │  │
│  │  │  │ │                                              ││   │  │  │
│  │  │  │ │ Management Settings:                         ││   │  │  │
│  │  │  │ │ • Max Total: [════●════] 10                ││   │  │  │
│  │  │  │ │ • Max Per Symbol: [═●═] 2                  ││   │  │  │
│  │  │  │ │ • Position Scaling: ☑ On                    ││   │  │  │
│  │  │  │ └────────────────────────────────────────────┘│   │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌─ Preset Trade ──────────────────────────────────┐   │  │  │
│  │  │  │ ⚡ Preset Trade | Running | Auto-Optimal | ▼ E │   │  │  │
│  │  │  │                                                 │   │  │  │
│  │  │  │ ▼ EXPANDED:                                     │   │  │  │
│  │  │  │ ┌─ Preset Selector ────────────────────────────┐│   │  │  │
│  │  │  │ │ Active: [Auto-Optimal ▼]                    ││   │  │  │
│  │  │  │ │ Score: 87.5 | Created: 2024-03-15          ││   │  │  │
│  │  │  │ └────────────────────────────────────────────┘│   │  │  │
│  │  │  │ ┌─ Statistics ─────────────────────────────────┐│   │  │  │
│  │  │  │ │ P&L: +$2,450.75 (+3.2%)                    ││   │  │  │
│  │  │  │ │ Positions: 5 Coordinated                   ││   │  │  │
│  │  │  │ │ Win Rate: 72% Expected                     ││   │  │  │
│  │  │  │ └────────────────────────────────────────────┘│   │  │  │
│  │  │  │ ┌─ Engine Controls ────────────────────────────┐│   │  │  │
│  │  │  │ │ [▶ Start] [⏸ Pause] [↻ Resume] [■ Stop]    ││   │  │  │
│  │  │  │ │ [🔄 Switch] [🧪 Test]                       ││   │  │  │
│  │  │  │ └────────────────────────────────────────────┘│   │  │  │
│  │  │  │ ┌─ Configuration ──────────────────────────────┐│   │  │  │
│  │  │  │ │ Details | Config | Presets                  ││   │  │  │
│  │  │  │ │                                              ││   │  │  │
│  │  │  │ │ Details Tab:                                 ││   │  │  │
│  │  │  │ │ • Name: Auto-Optimal                        ││   │  │  │
│  │  │  │ │ • Type: Auto-Optimal                        ││   │  │  │
│  │  │  │ │ • Created: 2024-03-15                       ││   │  │  │
│  │  │  │ │ • Score: [████████░░] 87.5%                ││   │  │  │
│  │  │  │ │ • Auto-Update: ☑ On                        ││   │  │  │
│  │  │  │ └────────────────────────────────────────────┘│   │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌─ Connection Card 2 (Kraken) ──────────────────────────┐   │  │
│  │  │ Similar structure to Connection Card 1...             │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                               │  │
│  │  ┌─ Connection Card 3 (Crypto.com) ──────────────────────┐   │  │
│  │  │ Similar structure to Connection Card 1...             │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Intervals & Strategies Overview ─────────────────────────────┐  │
│  │ Strategy performance summary & interval configuration         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Statistics Overview V2 ──────────────────────────────────────┐  │
│  │ Comprehensive trading statistics & performance metrics         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ System Monitoring Panel ────────────────────────────────────┐   │
│  │ API health | Response times | System status | Alerts         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
Dashboard (Parent)
├── GlobalCoordinatorStatus
├── SystemOverview
├── GlobalTradeEngineControls
├── DashboardActiveConnectionsManager
│   └── ActiveConnectionCard (repeated for each connection)
│       ├── CollapsibleTrigger (Header Section)
│       │   ├── Connection Name & Badges
│       │   ├── Status Badges
│       │   ├── Info/Settings/Logs Buttons
│       │   └── Expand Button
│       │
│       ├── Progress Bar (visible when starting)
│       │
│       └── CollapsibleContent (Expanded Section)
│           ├── Connection Details Grid
│           ├── VolumeConfigurationPanel (NEW)
│           │   ├── Live Volume Slider + Presets
│           │   ├── Preset Volume Slider + Presets
│           │   └── Order Type + Volume Type Selectors
│           │
│           ├── OrderSettingsPanel (NEW)
│           │   ├── Market Settings (conditional)
│           │   │   ├── Slippage Slider
│           │   │   └── Auto-Execution Toggle
│           │   └── Limit Settings (conditional)
│           │       ├── Price Offset Slider
│           │       └── Timeout Input
│           │
│           ├── MainTradeCard (NEW)
│           │   ├── Header (Status + Stats)
│           │   ├── Statistics Grid
│           │   ├── Engine Controls
│           │   └── Tabbed Configuration
│           │       ├── Entry Settings Tab
│           │       ├── Exit Settings Tab
│           │       └── Management Settings Tab
│           │
│           ├── PresetTradeCard (NEW)
│           │   ├── Header (Status + Preset)
│           │   ├── Preset Selector
│           │   ├── Statistics Grid
│           │   ├── Engine Controls
│           │   └── Tabbed Configuration
│           │       ├── Details Tab
│           │       ├── Configuration Tab
│           │       └── Presets Tab
│           │
│           └── Engine Progression Details
│
├── IntervalsStrategiesOverview
├── StatisticsOverviewV2
└── SystemMonitoringPanel
```

## Mobile Layout Adaptation

```
Mobile (< 768px):
├── Full-width cards
├── Stacked buttons (vertical)
├── Collapsed sections by default
├── Single column for statistics
└── Swipeable tabs for categories

Tablet (768px - 1024px):
├── 2-column layout for statistics
├── Side-by-side buttons
├── Expanded sections visible
└── 2-column tab content

Desktop (> 1024px):
├── Full responsive layout
├── 3-4 column statistics
├── Horizontal button layout
└── Optimized spacing
```

## Color Coding Reference

### Status Badges
- **Green (#10b981)**: Active/Running/Live
- **Yellow (#eab308)**: Starting/Paused
- **Red (#ef4444)**: Error/Stopped
- **Blue (#3b82f6)**: Ready/Idle
- **Purple (#a855f7)**: Preset Mode

### Value Indicators
- **Green**: Positive P&L, High win rate, Good metrics
- **Red**: Negative P&L, Low win rate, Risk metrics
- **Orange**: Warning, Caution needed
- **Gray**: Neutral, Disabled, Inactive

### Icon Legend
- 🟢 Green status indicator
- ⚡ Preset/Fast mode
- 🔄 Refresh/Update
- 🧪 Testing/Backtest
- ⚙ Settings
- 🗑 Delete/Remove
- ✓ Enabled/Active
- ✗ Disabled/Inactive

## Interaction Patterns

### Sliders
- Click/tap to set direct value
- Drag thumb for smooth adjustment
- Touch-friendly size (min 44px height)

### Buttons
- Clear visual feedback on hover
- Disabled state with reduced opacity
- Loading state with spinner

### Toggles
- Smooth animation on state change
- Clear enabled/disabled visual distinction

### Tabs
- Active tab highlighted with color
- Smooth tab switching
- Keyboard navigation support (Tab key)

### Collapsibles
- Smooth expand/collapse animation
- Chevron rotation indicator
- State persisted if needed

### Dialogs
- Modal overlay to focus attention
- Smooth fade-in/out animation
- ESC key to close
- Focus trap inside modal

## Spacing & Sizing

### Padding
- Container padding: 1rem (16px)
- Card padding: 1rem (16px)
- Section padding: 1rem (16px)
- Inner elements: 0.75rem (12px)

### Gaps
- Vertical spacing between major sections: 1rem (16px)
- Horizontal spacing between elements: 1rem (16px)
- Compact spacing (lists): 0.5rem (8px)

### Font Sizes
- Headers: 1.125rem (18px) - Main titles
- Subheaders: 0.875rem (14px) - Section titles
- Body: 0.875rem (14px) - Regular text
- Small: 0.75rem (12px) - Helper text, labels

### Icons
- Large: 1.25rem (20px)
- Standard: 1rem (16px)
- Small: 0.875rem (14px)

## Visual Hierarchy

1. **Primary**: Connection name, main status, large numbers
2. **Secondary**: Badges, labels, control buttons
3. **Tertiary**: Helper text, hints, expanded details
4. **Background**: Separators, subtle backgrounds

## Accessibility Features

- **Keyboard Navigation**: Full tab/shift+tab support
- **Screen Reader Support**: Semantic HTML, ARIA labels
- **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Focus Indicators**: Clear, visible focus ring
- **Touch Targets**: Minimum 44x44px for mobile

## Animation Specs

- **Duration**: 200-300ms for most transitions
- **Easing**: Smooth cubic-bezier for natural motion
- **Slide/Expand**: Smooth height/width transitions
- **Fade**: 100-150ms for opacity changes
- **Spin**: 1s rotation for loaders

## Responsive Design Notes

1. **Mobile First**: Base styles for mobile, then enhance
2. **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
3. **Grid Changes**: 1-col → 2-col → 3-col/4-col
4. **Font Scaling**: Responsive font sizes with Tailwind
5. **Touch Optimization**: 44px+ tap targets, spacious layouts
