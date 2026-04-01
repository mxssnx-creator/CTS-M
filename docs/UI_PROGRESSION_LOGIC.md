# CTS v3 - UI Flow & Progression Logic
## Complete User Journey Documentation

---

## TABLE OF CONTENTS

1. [Initial Setup Flow](#initial-setup-flow)
2. [Dashboard Navigation](#dashboard-navigation)
3. [Settings Configuration](#settings-configuration)
4. [Trading Workflow](#trading-workflow)
5. [Preset Management](#preset-management)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [User Interactions](#user-interactions)
8. [State Management](#state-management)

---

## 1. INITIAL SETUP FLOW

### First-Time User Journey

\`\`\`
┌─────────────────────────────────────┐
│  1. Application Launch              │
│  → Check database status            │
│  → If not initialized: Show setup   │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  2. Database Setup                  │
│  → Choose: PostgreSQL or SQLite     │
│  → Enter connection details         │
│  → Test connection                  │
│  → Initialize database              │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  3. User Registration               │
│  → Enter username, email, password  │
│  → Create account                   │
│  → Auto-login                       │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  4. Exchange Connection Setup       │
│  → Navigate to Settings             │
│  → Add first exchange connection    │
│  → Test API credentials             │
│  → Enable connection                │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  5. Initial Settings Configuration  │
│  → Configure Overall/Main settings  │
│  → Set indication parameters        │
│  → Enable strategies                │
│  → Save settings                    │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  6. Start Trading                   │
│  → Return to Dashboard              │
│  → Click "Start Engine" on card     │
│  → Monitor positions in real-time   │
└─────────────────────────────────────┘
\`\`\`

### UI Components for Setup

#### Database Setup Screen
\`\`\`typescript
// components/database-installer.tsx
<Card>
  <CardHeader>
    <CardTitle>Database Setup</CardTitle>
  </CardHeader>
  <CardContent>
    <Tabs>
      <TabsList>
        <TabsTrigger value="sqlite">SQLite (Local)</TabsTrigger>
        <TabsTrigger value="postgres">PostgreSQL (Remote)</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sqlite">
        <Button onClick={initializeSQLite}>
          Initialize Local Database
        </Button>
      </TabsContent>
      
      <TabsContent value="postgres">
        <Input 
          placeholder="postgresql://user:pass@host:5432/db"
          value={connectionString}
          onChange={handleChange}
        />
        <Button onClick={testConnection}>Test Connection</Button>
        <Button onClick={initializePostgres}>Initialize</Button>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
\`\`\`

#### Registration Form
\`\`\`typescript
// app/register/page.tsx
<Card className="max-w-md mx-auto">
  <CardHeader>
    <CardTitle>Create Account</CardTitle>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleRegister}>
      <Input 
        label="Username"
        value={username}
        onChange={setUsername}
      />
      <Input 
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
      />
      <Input 
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
      />
      <Button type="submit">Register</Button>
    </form>
  </CardContent>
</Card>
\`\`\`

---

## 2. DASHBOARD NAVIGATION

### Main Dashboard Layout

\`\`\`
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR                    │  MAIN CONTENT              │
│  ┌────────────────┐         │  ┌──────────────────────┐ │
│  │ Dashboard      │◄────────┼──┤ Connection Cards     │ │
│  │ Live Trading   │         │  │ • Binance Account    │ │
│  │ Settings       │         │  │   ├─ Status: Active  │ │
│  │ Presets        │         │  │   ├─ Positions: 5    │ │
│  │ Statistics     │         │  │   ├─ P/L: +$125.50   │ │
│  │ Monitoring     │         │  │   └─ Actions: ⚙️ ⏹️   │ │
│  │ Indications    │         │  │                      │ │
│  │ Strategies     │         │  │ • ByBit Account      │ │
│  └────────────────┘         │  │   ├─ Status: Stopped │ │
│                              │  │   └─ ...             │ │
│  ┌────────────────┐         │  └──────────────────────┘ │
│  │ Theme: White   │         │                            │
│  │ Style: Default │         │  ┌──────────────────────┐ │
│  └────────────────┘         │  │ System Overview      │ │
│                              │  │ • Total Positions    │ │
│                              │  │ • Active Connections │ │
│                              │  │ • Total P/L          │ │
│                              │  └──────────────────────┘ │
└──────────────────────────────────────────────────────────┘
\`\`\`

### Navigation Structure

\`\`\`typescript
// Sidebar menu items
const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Main overview"
  },
  {
    title: "Live Trading",
    url: "/live-trading",
    icon: TrendingUp,
    description: "Active positions monitoring"
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    submenu: [
      { title: "Overall/Main", url: "/settings#overall" },
      { title: "Exchange", url: "/settings#exchange" },
      { title: "Indication", url: "/settings#indication" },
      { title: "Strategy", url: "/settings#strategy" },
      { title: "System", url: "/settings#system" }
    ]
  },
  {
    title: "Presets",
    url: "/presets",
    icon: Database,
    description: "Preset configurations"
  },
  {
    title: "Statistics",
    url: "/statistics",
    icon: BarChart,
    description: "Performance analytics"
  },
  {
    title: "Monitoring",
    url: "/monitoring",
    icon: Activity,
    description: "System logs and errors"
  },
  {
    title: "Indications",
    url: "/indications",
    icon: Zap,
    description: "Indication signals"
  },
  {
    title: "Strategies",
    url: "/strategies",
    icon: Target,
    description: "Strategy performance"
  }
]
\`\`\`

### Connection Card Interactions

\`\`\`typescript
// components/dashboard/connection-card.tsx
<Card>
  <CardHeader>
    <CardTitle>{connection.name}</CardTitle>
    <Badge variant={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Stopped"}
    </Badge>
  </CardHeader>
  
  <CardContent>
    {/* Status Indicators */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Positions</p>
        <p className="text-2xl font-bold">{positionCount}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">P/L</p>
        <p className={`text-2xl font-bold ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatCurrency(pnl)}
        </p>
      </div>
    </div>
    
    {/* Real-time Updates */}
    {positions.map(position => (
      <div key={position.id} className="flex justify-between">
        <span>{position.symbol}</span>
        <span className={position.profitFactor >= 1 ? 'text-success' : 'text-destructive'}>
          {formatPercent(position.profitFactor - 1)}
        </span>
      </div>
    ))}
  </CardContent>
  
  <CardFooter>
    {/* Action Buttons */}
    <div className="flex gap-2">
      {!isActive && (
        <Button onClick={handleStart}>
          <Play className="h-4 w-4 mr-2" />
          Start Engine
        </Button>
      )}
      {isActive && (
        <Button variant="destructive" onClick={handleStop}>
          <Square className="h-4 w-4 mr-2" />
          Stop Engine
        </Button>
      )}
      <Button variant="outline" onClick={openSettings}>
        <Settings2 className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={openLog}>
        <FileText className="h-4 w-4" />
      </Button>
    </div>
  </CardFooter>
</Card>
\`\`\`

---

## 3. SETTINGS CONFIGURATION

### Settings Page Tab Structure

\`\`\`
┌──────────────────────────────────────────────────────────┐
│  SETTINGS                                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [Overall/Main] [Exchange] [Indication] [Strategy]  │  │
│  │ [System]                                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────── Overall/Main ───────────────────┐  │
│  │                                                     │  │
│  │  Volume Configuration                              │  │
│  │  ├─ Base Volume Factor: [1.0    ]                 │  │
│  │  ├─ Positions Average:  [50     ]                 │  │
│  │  └─ Max Positions:      [50     ]                 │  │
│  │                                                     │  │
│  │  Leverage Configuration                            │  │
│  │  └─ Leverage %: [━━━━━━○────] 10%                 │  │
│  │                                                     │  │
│  │  Position Cost Configuration                       │  │
│  │  └─ Position Cost: [━━○──────] 0.1%               │  │
│  │     ⚠️ IMPORTANT: 0.1 = 0.1%, NOT 10%!            │  │
│  │                                                     │  │
│  │  Symbol Configuration                              │  │
│  │  ├─ Order Type: [Volume 24h     ▼]               │  │
│  │  ├─ Symbol Count: [━━━━━━━━○──] 8                │  │
│  │  ├─ Quote Asset: [USDT          ▼]               │  │
│  │  └─ Use Main Symbols: [✓]                        │  │
│  │                                                     │  │
│  │  Main Symbols                                      │  │
│  │  ├─ BTC [×]  ETH [×]  BNB [×]                    │  │
│  │  ├─ XRP [×]  ADA [×]  SOL [×]                    │  │
│  │  └─ [+ Add Symbol]                                │  │
│  │                                                     │  │
│  │  Forced Symbols                                    │  │
│  │  ├─ XRP [×]  BCH [×]                              │  │
│  │  └─ [+ Add Symbol]                                │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  [Save All Settings]  [Export]  [Import]  [Reset]        │
└──────────────────────────────────────────────────────────┘
\`\`\`

### Settings Workflow

\`\`\`
1. USER OPENS SETTINGS
   ├─ Load current settings from API
   ├─ Populate all form fields
   └─ Show current values

2. USER MODIFIES SETTINGS
   ├─ onChange handlers update local state
   ├─ Validation runs on each change
   ├─ Show validation errors inline
   └─ Enable "Save" button if valid

3. USER CLICKS "SAVE ALL SETTINGS"
   ├─ Validate all settings
   ├─ POST to /api/settings
   ├─ Show loading state
   ├─ Handle success/error
   └─ Show toast notification

4. SETTINGS APPLIED
   ├─ Update database
   ├─ Notify running engines
   ├─ Engines reload settings
   └─ Continue with new config
\`\`\`

### Indication Settings Interaction

\`\`\`typescript
// app/settings/page.tsx - Indication tab

// Direction Indication Section
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Direction Indication</CardTitle>
      <Switch
        checked={settings.direction_enabled}
        onCheckedChange={(checked) => 
          handleSettingChange('direction_enabled', checked)
        }
      />
    </div>
  </CardHeader>
  
  <CardContent>
    {settings.direction_enabled && (
      <>
        {/* Range Configuration */}
        <div className="space-y-4">
          <Label>Range Configuration</Label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Begin</Label>
              <Input
                type="number"
                value={settings.direction_range_from}
                onChange={(e) => 
                  handleSettingChange('direction_range_from', Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label>End</Label>
              <Input
                type="number"
                value={settings.direction_range_to}
                onChange={(e) => 
                  handleSettingChange('direction_range_to', Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label>Step</Label>
              <Input
                type="number"
                value={settings.direction_range_step}
                onChange={(e) => 
                  handleSettingChange('direction_range_step', Number(e.target.value))
                }
              />
            </div>
          </div>
          
          {/* Real-time variation count */}
          <p className="text-sm text-muted-foreground">
            Total variations: {calculateVariations(
              settings.direction_range_from,
              settings.direction_range_to,
              settings.direction_range_step
            )}
          </p>
        </div>
        
        {/* Drawdown Values */}
        <div className="space-y-2">
          <Label>Drawdown Values (comma-separated %)</Label>
          <Input
            value={settings.direction_drawdown_values}
            onChange={(e) => 
              handleSettingChange('direction_drawdown_values', e.target.value)
            }
            placeholder="10,20,30,40,50"
          />
        </div>
        
        {/* Market Change Range */}
        <div className="space-y-2">
          <Label>Market Change Range</Label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              step="0.1"
              value={settings.direction_market_change_from}
              onChange={(e) => 
                handleSettingChange('direction_market_change_from', Number(e.target.value))
              }
            />
            <Input
              type="number"
              step="0.1"
              value={settings.direction_market_change_to}
              onChange={(e) => 
                handleSettingChange('direction_market_change_to', Number(e.target.value))
              }
            />
            <Input
              type="number"
              step="0.1"
              value={settings.direction_market_change_step}
              onChange={(e) => 
                handleSettingChange('direction_market_change_step', Number(e.target.value))
              }
            />
          </div>
        </div>
        
        {/* Min Calculation Time */}
        <div className="space-y-2">
          <Label>Min Calculation Time (seconds)</Label>
          <Slider
            value={[settings.direction_min_calc_time]}
            onValueChange={([value]) => 
              handleSettingChange('direction_min_calc_time', value)
            }
            min={1}
            max={60}
            step={1}
          />
          <p className="text-sm text-muted-foreground">
            {settings.direction_min_calc_time}s
          </p>
        </div>
        
        {/* Last Part Ratio */}
        <div className="space-y-2">
          <Label>Last Part Ratio</Label>
          <Slider
            value={[settings.direction_last_part_ratio]}
            onValueChange={([value]) => 
              handleSettingChange('direction_last_part_ratio', value)
            }
            min={0.1}
            max={0.5}
            step={0.05}
          />
          <p className="text-sm text-muted-foreground">
            {(settings.direction_last_part_ratio * 100).toFixed(0)}%
          </p>
        </div>
        
        {/* Ratio Factor Range */}
        <div className="space-y-2">
          <Label>Ratio Factor Range</Label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              step="0.1"
              value={settings.direction_ratio_factor_from}
              onChange={(e) => 
                handleSettingChange('direction_ratio_factor_from', Number(e.target.value))
              }
            />
            <Input
              type="number"
              step="0.1"
              value={settings.direction_ratio_factor_to}
              onChange={(e) => 
                handleSettingChange('direction_ratio_factor_to', Number(e.target.value))
              }
            />
            <Input
              type="number"
              step="0.1"
              value={settings.direction_ratio_factor_step}
              onChange={(e) => 
                handleSettingChange('direction_ratio_factor_step', Number(e.target.value))
              }
            />
          </div>
        </div>
      </>
    )}
  </CardContent>
</Card>

// Common Indicators Section
<Card>
  <CardHeader>
    <CardTitle>Common Indicators</CardTitle>
  </CardHeader>
  
  <CardContent>
    {/* RSI Configuration */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>RSI (Relative Strength Index)</Label>
        <Switch
          checked={settings.rsi_enabled}
          onCheckedChange={(checked) => 
            handleSettingChange('rsi_enabled', checked)
          }
        />
      </div>
      
      {settings.rsi_enabled && (
        <>
          <div>
            <Label>Period (Default: 14)</Label>
            <Input
              type="number"
              value={settings.rsi_period}
              onChange={(e) => 
                handleSettingChange('rsi_period', Number(e.target.value))
              }
            />
          </div>
          
          <div>
            <Label>Configuration Range (50% variation)</Label>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="From"
                value={settings.rsi_period_from}
                onChange={(e) => 
                  handleSettingChange('rsi_period_from', Number(e.target.value))
                }
              />
              <Input
                type="number"
                placeholder="To"
                value={settings.rsi_period_to}
                onChange={(e) => 
                  handleSettingChange('rsi_period_to', Number(e.target.value))
                }
              />
              <Input
                type="number"
                placeholder="Step"
                value={settings.rsi_period_step}
                onChange={(e) => 
                  handleSettingChange('rsi_period_step', Number(e.target.value))
                }
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Variations: {calculateVariations(
                settings.rsi_period_from,
                settings.rsi_period_to,
                settings.rsi_period_step
              )}
            </p>
          </div>
          
          {/* Similar for oversold and overbought */}
        </>
      )}
    </div>
    
    {/* MACD and EMA similar structure */}
  </CardContent>
</Card>
\`\`\`

---

## 4. TRADING WORKFLOW

### Position Lifecycle in UI

\`\`\`
┌─────────────────────────────────────────────────────────┐
│  STAGE 1: INDICATION SIGNAL                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Indications Page (/indications)                  │  │
│  │  • Shows real-time indication bars                │  │
│  │  • Color-coded by type (Direction/Move/Active)    │  │
│  │  • Signal strength indicator                      │  │
│  │  • Last update timestamp                          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────┐
│  STAGE 2: POSITION CREATION                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Dashboard - Connection Card                      │  │
│  │  • New position appears immediately               │  │
│  │  • Shows entry price                              │  │
│  │  • Shows TP/SL levels                             │  │
│  │  • Status: "Active" with green badge              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Live Trading Page (/live-trading)                │  │
│  │  • Position added to list                         │  │
│  │  • Real-time P/L updates                          │  │
│  │  • Position age counter                           │  │
│  │  • Action buttons (Close, Modify)                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────┐
│  STAGE 3: POSITION MONITORING                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Real-time Updates (every 100ms)                  │  │
│  │  • Current price updates                          │  │
│  │  • Profit factor recalculated                     │  │
│  │  • Color changes: red → yellow → green            │  │
│  │  • Trailing stop visualization (if enabled)       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Position Card                                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ BTCUSDT                    [Close]          │  │  │
│  │  │ Entry: $50,000 → Current: $50,500          │  │  │
│  │  │ P/L: +$500 (+1.0%)                          │  │  │
│  │  │ TP: $51,000 (2.0%) │ SL: $49,500 (-1.0%)   │  │  │
│  │  │ Age: 5m 23s │ Updates: 3,230               │  │  │
│  │  │ [━━━━━━━━━━━━━━━━━━━━━━] 50% to TP         │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────┐
│  STAGE 4: POSITION CLOSING                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Position Closed Notification                     │  │
│  │  🎉 BTCUSDT position closed                       │  │
│  │  Reason: Takeprofit reached                       │  │
│  │  Final P/L: +$1,020 (+2.04%)                      │  │
│  │  Duration: 15m 43s                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Dashboard Updates                                │  │
│  │  • Position removed from active list              │  │
│  │  • Total P/L updated                              │  │
│  │  • Position count decremented                     │  │
│  │  • Slot freed for new position                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Statistics Page Update                           │  │
│  │  • Add to closed positions history                │  │
│  │  • Update win rate                                │  │
│  │  • Update average profit factor                   │  │
│  │  • Update strategy performance                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Position Card Component

\`\`\`typescript
// components/live-trading/position-card.tsx
<Card className="relative overflow-hidden">
  {/* Profit indicator background */}
  <div 
    className={`absolute inset-0 opacity-10 ${
      profitFactor >= 1 ? 'bg-success' : 'bg-destructive'
    }`}
  />
  
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CardTitle>{position.symbol}</CardTitle>
        <Badge variant={position.indicationType === 'direction' ? 'default' : 'secondary'}>
          {position.indicationType}
        </Badge>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleClose}>
            Close Position
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleModify}>
            Modify TP/SL
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewDetails}>
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4">
    {/* Price Information */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Entry</p>
        <p className="text-lg font-semibold">{formatPrice(position.entryPrice)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Current</p>
        <p className="text-lg font-semibold">{formatPrice(position.currentPrice)}</p>
      </div>
    </div>
    
    {/* P/L Information */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Profit/Loss</span>
        <span className={`text-lg font-bold ${
          profitFactor >= 1 ? 'text-success' : 'text-destructive'
        }`}>
          {formatPercent((profitFactor - 1) * 100)}
        </span>
      </div>
      
      {/* Progress to TP */}
      <Progress 
        value={calculateTPProgress(position.entryPrice, position.currentPrice, position.takeprofitFactor)}
        className={profitFactor >= 1 ? 'bg-success' : 'bg-destructive'}
      />
      <p className="text-xs text-muted-foreground text-center">
        {calculateTPProgress(position.entryPrice, position.currentPrice, position.takeprofitFactor).toFixed(1)}% to TP
      </p>
    </div>
    
    {/* TP/SL Levels */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Takeprofit</p>
        <p className="text-sm font-semibold text-success">
          {formatPrice(position.entryPrice * position.takeprofitFactor)}
        </p>
        <p className="text-xs text-muted-foreground">
          (+{formatPercent((position.takeprofitFactor - 1) * 100)})
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Stoploss</p>
        <p className="text-sm font-semibold text-destructive">
          {formatPrice(position.entryPrice * (1 - (position.takeprofitFactor - 1) * position.stoplossRatio))}
        </p>
        <p className="text-xs text-muted-foreground">
          (-{formatPercent((position.takeprofitFactor - 1) * position.stoplossRatio * 100)})
        </p>
      </div>
    </div>
    
    {/* Trailing Stop (if enabled) */}
    {position.trailingEnabled && (
      <div className="p-3 bg-muted rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Trailing Stop Active</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Start:</span>
            <span className="ml-2 font-medium">
              {formatPercent((position.trailStart - 1) * 100)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Stop:</span>
            <span className="ml-2 font-medium">
              {formatPercent(position.trailStop * 100)}
            </span>
          </div>
        </div>
        {profitFactor >= position.trailStart && (
          <div className="flex items-center gap-2 text-xs text-success">
            <CheckCircle className="h-3 w-3" />
            <span>Trailing activated at {formatPrice(trailingPeak)}</span>
          </div>
        )}
      </div>
    )}
    
    {/* Position Metrics */}
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div>
        <p className="text-muted-foreground">Age</p>
        <p className="font-medium">{formatDuration(position.positionAgeSeconds)}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Updates</p>
        <p className="font-medium">{position.totalUpdates}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Avg Interval</p>
        <p className="font-medium">{position.avgUpdateInterval}ms</p>
      </div>
    </div>
  </CardContent>
  
  <CardFooter>
    <Button 
      variant="destructive" 
      className="w-full"
      onClick={handleClosePosition}
    >
      Close Position
    </Button>
  </CardFooter>
</Card>
\`\`\`

---

## 5. PRESET MANAGEMENT

### Preset Creation Workflow

\`\`\`
1. USER CLICKS "CREATE PRESET"
   └─ Open Create Configuration Set Dialog

2. BASIC TAB
   ├─ Enter set name
   ├─ Select indicators (RSI, MACD, EMA)
   └─ Click "Next"

3. INDICATOR PARAMETERS TAB
   ├─ For each selected indicator:
   │  ├─ Show dynamic parameter inputs
   │  ├─ From/To/Step for each parameter
   │  └─ Real-time variation count
   └─ Click "Next"

4. POSITION CONFIGURATION TAB
   ├─ Takeprofit range (from/to/step)
   ├─ Stoploss range (from/to/step)
   ├─ Trailing configurations
   └─ Click "Next"

5. EVALUATION SETTINGS TAB
   ├─ Min profit factor threshold
   ├─ Position count threshold
   ├─ Max drawdown hours
   ├─ Backtest days
   └─ Click "Create & Backtest"

6. BACKTEST EXECUTION
   ├─ Generate all configurations
   ├─ Run backtest for each config
   ├─ Calculate performance metrics
   ├─ Filter by thresholds
   └─ Show results

7. RESULTS DISPLAY
   ├─ Expandable statistics hierarchy
   ├─ Major → Minor → TP → SL → Trailing
   ├─ Performance metrics at each level
   └─ Save as Set button

8. SAVE SET
   ├─ Save to database
   ├─ Enable hourly evaluation
   └─ Add to Preset Type
\`\`\`

### Expandable Statistics Display

\`\`\`typescript
// components/presets/expandable-statistics-display.tsx

<div className="space-y-2">
  {/* Level 1: Major Ranges */}
  {majorRanges.map((major, i) => (
    <Collapsible key={i}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {/* Range Info */}
              <div className="flex-1">
                <h4 className="font-semibold">
                  {major.indicationType} ({major.rangeFrom}-{major.rangeTo})
                </h4>
                <p className="text-sm text-muted-foreground">
                  {major.totalConfigs} configurations, {major.validConfigs} valid
                </p>
              </div>
              
              {/* Metrics */}
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg PF</p>
                  <p className="font-semibold">{major.avgProfitFactor.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Win Rate</p>
                  <p className="font-semibold">{(major.winRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg DD</p>
                  <p className="font-semibold">{major.avgDrawdownHours.toFixed(1)}h</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="ml-6 mt-2 space-y-2">
          {/* Level 2: Minor Ranges */}
          {major.minorRanges.map((minor, j) => (
            <Collapsible key={j}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Range {minor.range}</p>
                        <p className="text-xs text-muted-foreground">
                          {minor.validConfigs} valid configs
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">PF</p>
                          <p className="font-medium">{minor.avgProfitFactor.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Win</p>
                          <p className="font-medium">{(minor.winRate * 100).toFixed(0)}%</p>
                        </div>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="ml-6 mt-2 space-y-2">
                  {/* Level 3: Takeprofit Steps */}
                  {minor.tpSteps.map((tp, k) => (
                    <Collapsible key={k}>
                      <CollapsibleTrigger asChild>
                        <Card className="cursor-pointer hover:bg-muted/50">
                          <CardContent className="py-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>TP: {(tp.factor * 100 - 100).toFixed(1)}%</span>
                              <div className="flex items-center gap-2">
                                <span>PF: {tp.avgProfitFactor.toFixed(2)}</span>
                                <span>Win: {(tp.winRate * 100).toFixed(0)}%</span>
                                <ChevronRight className="h-3 w-3" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-1">
                          {/* Level 4: Stoploss Ratios */}
                          {tp.slRatios.map((sl, l) => (
                            <Collapsible key={l}>
                              <CollapsibleTrigger asChild>
                                <Card className="cursor-pointer hover:bg-muted/50">
                                  <CardContent className="py-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span>SL: {(sl.ratio * 100).toFixed(0)}%</span>
                                      <div className="flex items-center gap-2">
                                        <span>{sl.avgProfitFactor.toFixed(2)}</span>
                                        <ChevronRight className="h-2 w-2" />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="ml-6 mt-1 space-y-1">
                                  {/* Level 5: Trailing Configurations */}
                                  {sl.trailingConfigs.map((trail, m) => (
                                    <Card key={m} className="bg-muted/30">
                                      <CardContent className="py-2">
                                        <div className="flex items-center justify-between text-xs">
                                          <span>
                                            {trail.enabled ? `Trail: ${trail.start}-${trail.stop}` : 'No Trail'}
                                          </span>
                                          <div className="flex items-center gap-3">
                                            <Badge variant={trail.profitFactor >= minProfitFactor ? 'success' : 'destructive'}>
                                              PF: {trail.profitFactor.toFixed(2)}
                                            </Badge>
                                            <span>Win: {(trail.winRate * 100).toFixed(0)}%</span>
                                            <span>DD: {trail.drawdownHours.toFixed(1)}h</span>
                                            <Button size="sm" variant="outline" onClick={() => selectConfig(trail.configId)}>
                                              Select
                                            </Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  ))}
</div>
\`\`\`

---

## 6. MONITORING & ANALYTICS

### Statistics Page Layout

\`\`\`
┌──────────────────────────────────────────────────────────┐
│  STATISTICS                                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Filters                                           │  │
│  │  ├─ Time Range: [Last 7 Days    ▼]               │  │
│  │  ├─ Connection: [All             ▼]               │  │
│  │  ├─ Strategy: [All               ▼]               │  │
│  │  └─ Symbol: [All                 ▼]               │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Overall Metrics                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐│  │
│  │  │Total P/L │ │Win Rate  │ │Avg PF    │ │Trades ││  │
│  │  │ +$5,423  │ │  67.3%   │ │  1.23    │ │  234  ││  │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────┘│  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Performance Chart                                 │  │
│  │  [Line chart showing cumulative P/L over time]     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Strategy Performance                              │  │
│  │  ┌────────────────────────────────────────────────┐│  │
│  │  │ Strategy  │ Trades │ Win Rate │ Avg PF │ P/L  ││  │
│  │  ├───────────┼────────┼──────────┼────────┼──────┤│  │
│  │  │ Main      │   145  │  68.2%   │  1.25  │+$3.2k││  │
│  │  │ Adjust    │    67  │  65.7%   │  1.21  │+$1.8k││  │
│  │  │ Block     │    22  │  72.7%   │  1.18  │+$432 ││  │
│  │  └────────────────────────────────────────────────┘│  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Symbol Performance                                │  │
│  │  [Bar chart showing top performing symbols]        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Recent Trades                                     │  │
│  │  [Table of last 20 closed positions]              │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
\`\`\`

### Monitoring Page

\`\`\`
┌──────────────────────────────────────────────────────────┐
│  MONITORING                                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [System Health] [Logs] [Errors] [Site Logs]       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  System Health                                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ ● Database: Healthy                          │  │  │
│  │  │ ● API: Responding                            │  │  │
│  │  │ ● WebSocket: Connected                       │  │  │
│  │  │ ● Trade Engines: 3 Active                    │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ CPU Usage:   [━━━━━━━━━━░░░░░░] 45%        │  │  │
│  │  │ Memory:      [━━━━━━░░░░░░░░░░] 32%        │  │  │
│  │  │ Disk Space:  [━━━░░░░░░░░░░░░░] 18%        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Logs (Live Update)                                │  │
│  │  Filters: [All Levels ▼] [All Categories ▼]       │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ [2025-01-26 12:34:56] INFO [engine]          │  │  │
│  │  │ Position opened: BTCUSDT at 50000            │  │  │
│  │  │                                              │  │  │
│  │  │ [2025-01-26 12:34:55] INFO [indication]     │  │  │
│  │  │ Direction signal: UP (confidence: 0.85)     │  │  │
│  │  │                                              │  │  │
│  │  │ [2025-01-26 12:34:50] WARN [exchange]       │  │  │
│  │  │ Rate limit approaching: 90/100              │  │  │
│  │  │                                              │  │  │
│  │  │ [2025-01-26 12:34:45] INFO [engine]          │  │  │
│  │  │ Position closed: ETHUSDT PF: 1.023          │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  [Export Logs] [Clear All]                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Errors                                            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ ⚠️ [UNRESOLVED] Connection timeout           │  │  │
│  │  │    Exchange: Binance | Time: 12:30:00        │  │  │
│  │  │    [View Stack] [Mark Resolved]              │  │  │
│  │  │                                              │  │  │
│  │  │ ⚠️ [UNRESOLVED] Failed to fetch price        │  │  │
│  │  │    Symbol: XRPUSDT | Time: 12:15:23          │  │  │
│  │  │    [View Stack] [Mark Resolved]              │  │  │
│  │  │                                              │  │  │
│  │  │ ✓ [RESOLVED] Database lock timeout           │  │  │
│  │  │    Resolved: 2 hours ago                     │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
\`\`\`

---

## 7. USER INTERACTIONS

### Real-time Updates

\`\`\`typescript
// Real-time data flow

1. WebSocket Connection
   └─ Established on app load
   └─ Connection per user session

2. Price Updates
   └─ Exchange → WebSocket Server → Client
   └─ Frequency: Every 100ms per symbol
   └─ Debounced UI updates: 100ms

3. Position Updates
   └─ Engine → Database → WebSocket → Client
   └─ Triggers: Price change, TP/SL hit, status change
   └─ UI re-renders affected components only

4. Indication Signals
   └─ Calculator → Engine → WebSocket → Client
   └─ Shows on Indications page in real-time
   └─ Color-coded by signal strength

5. Toast Notifications
   └─ Important events only
   └─ Position opened/closed
   └─ Errors and warnings
   └─ Settings saved
\`\`\`

### Data Fetching Strategy

\`\`\`typescript
// Using SWR for client-side state

// Dashboard - Positions
const { data: positions, mutate } = useSWR('/api/positions', fetcher, {
  refreshInterval: 1000,  // Poll every 1s
  revalidateOnFocus: true,
  revalidateOnReconnect: true
})

// WebSocket updates trigger mutate()
useEffect(() => {
  const ws = new WebSocket('/api/ws')
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data)
    
    if (update.type === 'position_update') {
      // Optimistic UI update
      mutate((current) => {
        return current.map(pos => 
          pos.id === update.positionId 
            ? { ...pos, ...update.data }
            : pos
        )
      }, false)  // Don't revalidate
    }
  }
  
  return () => ws.close()
}, [mutate])

// Settings - Load once, update on save
const { data: settings } = useSWR('/api/settings', fetcher, {
  revalidateOnFocus: false,  // Don't refetch on focus
  revalidateOnReconnect: false
})

const saveSettings = async (newSettings) => {
  // Optimistic update
  mutate(newSettings, false)
  
  // Save to server
  await fetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify(newSettings)
  })
  
  // Revalidate
  mutate()
}
\`\`\`

---

## 8. STATE MANAGEMENT

### Global State

\`\`\`typescript
// lib/auth-context.tsx - Authentication
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
}

// Usage
const { user, isAuthenticated, login, logout } = useAuth()

// components/site-logger-provider.tsx - Logging
interface LoggerState {
  logs: Log[]
  addLog: (level: string, category: string, message: string, details?: any) => void
  clearLogs: () => void
}

// Usage
const { addLog } = useSiteLogger()
addLog('info', 'ui', 'Button clicked', { buttonId: 'start-engine' })
\`\`\`

### Local State Patterns

\`\`\`typescript
// Component-level state
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// Form state
const [formData, setFormData] = useState({
  name: '',
  exchange: '',
  apiKey: '',
  apiSecret: ''
})

const handleChange = (field: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }))
}

// Dialog state
const [isOpen, setIsOpen] = useState(false)

// Table state
const [sortBy, setSortBy] = useState<string>('createdAt')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(20)
\`\`\`

---

## CONCLUSION

This UI documentation provides complete flow and interaction patterns for the CTS v3 system. Key points:

1. **Initial Setup** - Step-by-step database and connection setup
2. **Dashboard** - Real-time connection monitoring with live updates
3. **Settings** - Comprehensive configuration with inline validation
4. **Trading** - Complete position lifecycle with visual feedback
5. **Presets** - Multi-level configuration with expandable statistics
6. **Monitoring** - Real-time logs and system health tracking
7. **Real-time** - WebSocket integration with optimistic updates
8. **State** - SWR for server state, React hooks for local state

**All UI components follow:**
- Responsive design (mobile-first)
- Accessibility standards (WCAG 2.1)
- Real-time updates (WebSocket + SWR)
- Optimistic UI patterns
- Error boundaries and fallbacks
- Loading states and skeletons
- Toast notifications for feedback
- Theme and style consistency

**Last Updated:** 2025-01-26
**Version:** 3.1
**Status:** Production Ready
